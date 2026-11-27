import React from 'react';
import {Composition} from 'remotion';
import {ContactSheet, Video} from './Video';
import {COMPOSITION_ID, TIMELINE} from './data';
import {FPS, H, W} from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id={COMPOSITION_ID} component={Video} durationInFrames={Math.max(1, TIMELINE.total)} fps={FPS} width={W} height={H} />
    <Composition
      id="ContactSheet"
      component={ContactSheet}
      // 时长要和正片一样长，否则里面的分镜会被裁掉；导出时只取第 0 帧
      durationInFrames={Math.max(1, TIMELINE.total)}
      fps={FPS}
      width={12 + 3 * (480 + 12)}
      height={400}
      defaultProps={{frames: [0], labels: ['0']}}
      calculateMetadata={({props}) => ({height: 12 + Math.ceil(props.frames.length / 3) * (322 + 12)})}
    />
  </>
);
