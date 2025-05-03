// eventBus.js - 用于组件间通信的简单事件总线

import { ref } from "vue";

/**
 * 创建一个基于Vue 3组合式API的简单事件总线
 */
class EventBus {
  constructor() {
    this.events = {};
  }

  /**
   * 订阅事件
   * @param {string} eventName 事件名称
   * @param {Function} callback 回调函数
   */
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);

    // 返回取消订阅的函数
    return () => {
      this.off(eventName, callback);
    };
  }

  /**
   * 取消订阅事件
   * @param {string} eventName 事件名称
   * @param {Function} callback 要移除的回调函数
   */
  off(eventName, callback) {
    if (!this.events[eventName]) return;

    if (callback) {
      this.events[eventName] = this.events[eventName].filter(
        (cb) => cb !== callback
      );
    } else {
      // 如果没有提供回调，移除所有该事件的订阅
      delete this.events[eventName];
    }
  }

  /**
   * 触发事件
   * @param {string} eventName 事件名称
   * @param {any} data 要传递的数据
   */
  emit(eventName, data) {
    if (!this.events[eventName]) return;

    this.events[eventName].forEach((callback) => {
      callback(data);
    });
  }
}

// 创建和导出事件总线实例
export const eventBus = new EventBus();

// 定义应用中使用的事件名称常量
export const EVENT_NAMES = {
  SHOW_WELCOME_MODAL: "show-welcome-modal",
  APP_SPACE_CHANGED: "app-space-changed",
};

export default eventBus;
