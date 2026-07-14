import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronApi } from '../shared/electron-api'
import { IPC_CHANNELS } from '../shared/ipc-channels'

const api: ElectronApi = {
  system: {
    getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_VERSION)
  },
  auth: {
    login: (username, password) =>
      ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGIN, { username, password }),
    logout: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGOUT),
    getSession: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_GET_SESSION),
    changePassword: (newPassword) =>
      ipcRenderer.invoke(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, newPassword)
  },
  user: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.USER_LIST),
    create: (data) => ipcRenderer.invoke(IPC_CHANNELS.USER_CREATE, data),
    update: (id, data) => ipcRenderer.invoke(IPC_CHANNELS.USER_UPDATE, id, data),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.USER_DELETE, id),
    resetPassword: (id) => ipcRenderer.invoke(IPC_CHANNELS.USER_RESET_PASSWORD, id)
  },
  teacher: {
    create: (data) => ipcRenderer.invoke(IPC_CHANNELS.TEACHER_CREATE, data),
    list: () => ipcRenderer.invoke(IPC_CHANNELS.TEACHER_LIST),
    getById: (id) => ipcRenderer.invoke(IPC_CHANNELS.TEACHER_GET_BY_ID, id),
    update: (id, data) => ipcRenderer.invoke(IPC_CHANNELS.TEACHER_UPDATE, id, data),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.TEACHER_DELETE, id)
  },
  courseTemplate: {
    create: (data) => ipcRenderer.invoke(IPC_CHANNELS.COURSE_TEMPLATE_CREATE, data),
    list: () => ipcRenderer.invoke(IPC_CHANNELS.COURSE_TEMPLATE_LIST),
    getById: (id) => ipcRenderer.invoke(IPC_CHANNELS.COURSE_TEMPLATE_GET_BY_ID, id),
    update: (id, data) => ipcRenderer.invoke(IPC_CHANNELS.COURSE_TEMPLATE_UPDATE, id, data),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.COURSE_TEMPLATE_DELETE, id)
  },
  courseEdition: {
    create: (data) => ipcRenderer.invoke(IPC_CHANNELS.COURSE_EDITION_CREATE, data),
    list: () => ipcRenderer.invoke(IPC_CHANNELS.COURSE_EDITION_LIST),
    getById: (id) => ipcRenderer.invoke(IPC_CHANNELS.COURSE_EDITION_GET_BY_ID, id),
    update: (id, data) => ipcRenderer.invoke(IPC_CHANNELS.COURSE_EDITION_UPDATE, id, data),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.COURSE_EDITION_DELETE, id)
  },
  student: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.STUDENT_LIST),
    getById: (id) => ipcRenderer.invoke(IPC_CHANNELS.STUDENT_GET_BY_ID, id),
    findByDni: (dni) => ipcRenderer.invoke(IPC_CHANNELS.STUDENT_FIND_BY_DNI, dni),
    create: (data) => ipcRenderer.invoke(IPC_CHANNELS.STUDENT_CREATE, data),
    update: (id, data) => ipcRenderer.invoke(IPC_CHANNELS.STUDENT_UPDATE, id, data),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.STUDENT_DELETE, id)
  },
  enrollment: {
    create: (data) => ipcRenderer.invoke(IPC_CHANNELS.ENROLLMENT_CREATE, data),
    listByCourseEdition: (courseEditionId) =>
      ipcRenderer.invoke(IPC_CHANNELS.ENROLLMENT_LIST_BY_COURSE_EDITION, courseEditionId),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.ENROLLMENT_DELETE, id)
  },
  attendance: {
    register: (dni, courseEditionId) =>
      ipcRenderer.invoke(IPC_CHANNELS.ATTENDANCE_REGISTER, { dni, courseEditionId }),
    findByCourseEdition: (courseEditionId) =>
      ipcRenderer.invoke(IPC_CHANNELS.ATTENDANCE_FIND_BY_COURSE_EDITION, courseEditionId),
    findByStudent: (studentId) =>
      ipcRenderer.invoke(IPC_CHANNELS.ATTENDANCE_FIND_BY_STUDENT, studentId),
    list: (courseEditionId, date) =>
      ipcRenderer.invoke(IPC_CHANNELS.ATTENDANCE_LIST, { courseEditionId, date })
  },
  classSession: {
    generate: (courseEditionId) =>
      ipcRenderer.invoke(IPC_CHANNELS.CLASS_SESSION_GENERATE, courseEditionId),
    listByEdition: (courseEditionId) =>
      ipcRenderer.invoke(IPC_CHANNELS.CLASS_SESSION_LIST_BY_EDITION, courseEditionId)
  },
  teacherCourse: {
    listMyCourses: () => ipcRenderer.invoke(IPC_CHANNELS.TEACHER_COURSE_LIST_MY_COURSES),
    getDetail: (courseEditionId) =>
      ipcRenderer.invoke(IPC_CHANNELS.TEACHER_COURSE_GET_DETAIL, courseEditionId)
  }
}

contextBridge.exposeInMainWorld('api', api)
