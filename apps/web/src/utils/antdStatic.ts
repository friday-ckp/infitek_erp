/**
 * antdStatic — stores App.useApp() instances so non-component code
 * (axios interceptors, queryClient callbacks) can call message/modal
 * without the "Static function can not consume context" warning.
 *
 * Usage:
 *   import antdStatic from '../utils/antdStatic';
 *   antdStatic.message.error('...');
 */
import type { MessageInstance } from 'antd/es/message/interface';
import type { ModalStaticFunctions } from 'antd/es/modal/confirm';

type ModalInstance = Omit<ModalStaticFunctions, 'warn'>;

const antdStatic: { message: MessageInstance; modal: ModalInstance } = {
  message: undefined as unknown as MessageInstance,
  modal: undefined as unknown as ModalInstance,
};

export function initAntdStatic(message: MessageInstance, modal: ModalInstance) {
  antdStatic.message = message;
  antdStatic.modal = modal;
}

export default antdStatic;
