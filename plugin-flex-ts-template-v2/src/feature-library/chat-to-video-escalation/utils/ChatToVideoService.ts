import axios from 'axios';

import { EncodedParams } from '../../../types/serverless';
import ApiService from '../../../utils/serverless/ApiService';
import logger from '../../../utils/logger';

export interface GenerateCodeResponse {
  RoomName: string;
  RoomSid: string;
}

export interface CompleteRoomResponse {
  success: boolean;
}

class ChatToVideoService extends ApiService {
  generateUrl = (identity: string, roomName: string): string =>
    `${this.serverlessProtocol}://${this.serverlessDomain}/features/chat-to-video-escalation/index.html?identity=${identity}&roomName=${roomName}`;

  generateVideoChannel = async (taskSid: string): Promise<GenerateCodeResponse> => {
    const rawData = {
      type: 'video',
      initiated_by: 'agent',
      properties: {
        type: 'video',
      },
    };
    const axiosConfig = {
      headers: {
        'Content-Type': 'application/json',
        // TODO: Replace with real Twilio Account SID
        'I-Twilio-Auth-Account': `${env.process.TWILIO_ACCOUNT_SID}`,
      },
    };
    try {
      // TODO: Replace with URL
      const { data } = await axios
        .post(
          'http://localhost:1530/v1/Interactions/KDe92ba23823424a8a2e38154077162f7b/Channels',
          rawData,
          axiosConfig,
        )
        .then(async (response) => {
          console.log(`Flex Video Interaction Channel Created. `, response.data);
          // Update task attributes with the video info, to enable Video Room tab
          const encodedParams: EncodedParams = {
            attributesUpdate: encodeURIComponent(JSON.stringify(response.data.media_properties)),
            Token: encodeURIComponent(this.manager.user.token),
            taskSid: encodeURIComponent(taskSid),
          };
          await this.fetchJsonWithReject(
            `${this.serverlessProtocol}://${this.serverlessDomain}/common/flex/taskrouter/update-task-attributes`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: this.buildBody(encodedParams),
            },
          );
          return response;
        });
      return <GenerateCodeResponse>data.media_properties;
    } catch (error: any) {
      logger.error(`[chat-to-video-escalation] Error generating unique video code\r\n`, error);
      throw error;
    }
  };

  completeRoom = async (flexInteractionChannelSid: string): Promise<CompleteRoomResponse> => {
    const rawData = {
      status: 'closed',
    };
    const axiosConfig = {
      headers: {
        'Content-Type': 'application/json',
        // TODO: Replace with real Twilio Account SID
        'I-Twilio-Auth-Account': `${env.process.TWILIO_ACCOUNT_SID}`,
      },
    };
    try {
      // TODO: Replace with URL
      return await axios
        .post(
          `http://localhost:1530/v1/Interactions/KDe92ba23823424a8a2e38154077162f7b/Channels/${flexInteractionChannelSid}`,
          rawData,
          axiosConfig,
        )
        .then((response) => {
          console.log(`response`, response);
          return <CompleteRoomResponse>{ success: true };
        });
    } catch (error: any) {
      logger.error(`[chat-to-video-escalation] Error completing video room\r\n`, error);
      throw error;
    }
  };
}

export default new ChatToVideoService();
