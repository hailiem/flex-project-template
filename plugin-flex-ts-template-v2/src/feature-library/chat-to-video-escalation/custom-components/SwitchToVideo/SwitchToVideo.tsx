import React, { useState } from 'react';
import { Actions, ITask, ConversationState, Notifications, styled, IconButton, templates } from '@twilio/flex-ui';

import { ChatToVideoNotification } from '../../flex-hooks/notifications/ChatToVideo';
import { StringTemplates } from '../../flex-hooks/strings/ChatToVideo';
import ChatToVideoService from '../../utils/ChatToVideoService';
import logger from '../../../../utils/logger';

interface SwitchToVideoProps {
  task: ITask;
  context?: any;
  conversation?: ConversationState.ConversationState;
}

const IconContainer = styled.div`
  margin: auto;
  padding-right: 0.8em;
`;

const SwitchToVideo: React.FunctionComponent<SwitchToVideoProps> = ({ task, conversation }) => {
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    setIsLoading(true);

    const { taskSid } = task;
    let identity = 'Customer';
    for (const key of conversation?.participants?.keys() as IterableIterator<string>) {
      console.log(key);
      if (key.startsWith('FX')) {
        identity = key;
      }
    }

    try {
      const response = await ChatToVideoService.generateVideoChannel(taskSid);
      console.log(`FlexVideoChannel created: ${response.RoomName}`);

      if (!response.RoomName) {
        Notifications.showNotification(ChatToVideoNotification.FailedVideoLinkNotification);
        setIsLoading(false);
        return;
      }

      await Actions.invokeAction('SendMessage', {
        body: `${templates[StringTemplates.InviteMessage]()}`,
        conversation,
        messageAttributes: {
          videoCallSettings: {
            roomName: response.RoomName,
            identity,
          },
        },
      });
    } catch (error: any) {
      logger.error('[chat-to-video-escalation] error creating unique video link:', error);
      Notifications.showNotification(ChatToVideoNotification.FailedVideoLinkNotification);
    }

    setIsLoading(false);
  };

  return (
    <IconContainer>
      <IconButton
        icon="Video"
        key="chat-video-transfer-button"
        disabled={isLoading}
        onClick={onClick}
        variant="secondary"
        title={templates[StringTemplates.SwitchToVideo]()}
      />
    </IconContainer>
  );
};

export default SwitchToVideo;
