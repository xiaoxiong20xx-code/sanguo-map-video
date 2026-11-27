"""配音：python tts.py jobs.json
jobs.json = [{"text": 配音文字, "voice": 声音, "rate": "+10%", "out": mp3 路径}, ...]
每条生成 mp3 和同名 .words.json（每个词的起止秒数），已存在就跳过（缓存）。"""
import asyncio
import json
import os
import sys

import edge_tts


async def one(job):
    words_path = job['out'][:-4] + '.words.json'
    if os.path.exists(job['out']) and os.path.exists(words_path):
        return 'cached'
    comm = edge_tts.Communicate(job['text'], job['voice'], rate=job['rate'], boundary='WordBoundary',
                                proxy=os.environ.get('EDGE_TTS_PROXY') or os.environ.get('HTTPS_PROXY'))
    audio, words = bytearray(), []
    async for chunk in comm.stream():
        if chunk['type'] == 'audio':
            audio += chunk['data']
        elif chunk['type'] == 'WordBoundary':
            words.append({'text': chunk['text'], 'start': chunk['offset'] / 1e7, 'end': (chunk['offset'] + chunk['duration']) / 1e7})
    if not audio or not words:
        raise RuntimeError('没有拿到配音：' + job['text'][:20])
    tmp = job['out'] + '.part'
    with open(tmp, 'wb') as f:
        f.write(audio)
    os.replace(tmp, job['out'])
    with open(words_path, 'w', encoding='utf-8') as f:
        json.dump(words, f, ensure_ascii=False)
    return 'new'


async def main():
    with open(sys.argv[1], encoding='utf-8') as f:
        jobs = json.load(f)
    for i, job in enumerate(jobs):
        for attempt in range(3):
            try:
                state = await one(job)
                print(f'{i + 1}/{len(jobs)} {state}', flush=True)
                break
            except Exception as e:  # 网络抖动重试
                if attempt == 2:
                    print(f'配音失败：{e}', file=sys.stderr)
                    sys.exit(1)
                await asyncio.sleep(2)


asyncio.run(main())
