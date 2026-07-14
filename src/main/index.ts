import { fileURLToPath, URL } from 'node:url'
import { app, BrowserWindow, shell } from 'electron'
import { registerAuthIpc } from './ipc/auth'
import { registerUserIpc } from './ipc/user'
import { registerSystemIpc } from './ipc/system'
import { registerTeacherIpc } from './ipc/teacher'
import { registerCourseTemplateIpc } from './ipc/course-template'
import { registerCourseEditionIpc } from './ipc/course-edition'
import { registerStudentIpc } from './ipc/student'
import { registerEnrollmentIpc } from './ipc/enrollment'
import { registerAttendanceIpc } from './ipc/attendance'
import { registerClassSessionIpc } from './ipc/class-session'
import { registerTeacherCourseIpc } from './ipc/teacher-course'
import { connectToDatabase } from './db/connection'

const resolvePath = (path: string): string => fileURLToPath(new URL(path, import.meta.url))

function createMainWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: resolvePath('../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(resolvePath('../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerAuthIpc()
  registerUserIpc()
  registerSystemIpc()
  registerTeacherIpc()
  registerCourseTemplateIpc()
  registerCourseEditionIpc()
  registerStudentIpc()
  registerEnrollmentIpc()
  registerAttendanceIpc()
  registerClassSessionIpc()
  registerTeacherCourseIpc()
  createMainWindow()

  connectToDatabase()
    .then(() => console.log('MongoDB conectado correctamente'))
    .catch((error: unknown) => console.error('Error al conectar a MongoDB:', error))
})

app.on('window-all-closed', () => {
  app.quit()
})
