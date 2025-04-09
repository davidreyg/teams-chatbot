import {
  ActivityHandler,
  BotState,
  ConversationState,
  MessageFactory,
  StatePropertyAccessor,
  UserState,
} from 'botbuilder';
import { Dialog, DialogState } from 'botbuilder-dialogs';
import { UserProfileDialog } from '../dialogs/incidentDialog';

export class DialogBot extends ActivityHandler {
  private conversationState: BotState;
  private userState: BotState;
  private dialog: Dialog;
  private dialogState: StatePropertyAccessor<DialogState>;

  /**
   *
   * @param {ConversationState} conversationState
   * @param {UserState} userState
   * @param {Dialog} dialog
   */
  constructor(conversationState: BotState, userState: BotState, dialog: Dialog) {
    super();
    if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
    if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
    if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');

    this.conversationState = conversationState as ConversationState;
    this.userState = userState as UserState;
    this.dialog = dialog;
    this.dialogState = this.conversationState.createProperty('DialogState');

    // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
    this.onMessage(async (context, next) => {
      console.log('Running dialog with Message Activity.');

      // Run the Dialog with the new message Activity.
      await (this.dialog as UserProfileDialog).run(context, this.dialogState);

      await next();
    });

    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      const welcomeText = 'Hola! Bienvenido a tu asistente inteligente.';
      for (const member of membersAdded) {
        if (member.id !== context.activity.recipient.id) {
          await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
          await (this.dialog as UserProfileDialog).run(context, this.dialogState);
        }
      }
      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

    this.onDialog(async (context, next) => {
      // Save any state changes. The load happened during the execution of the Dialog.
      await this.conversationState.saveChanges(context, false);
      await this.userState.saveChanges(context, false);
      await next();
    });
  }
}
