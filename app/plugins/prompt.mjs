import inquirer from 'inquirer'

import { LocalStoragePlugin, GlobalStoragePlugin } from './storage.mjs'

export default class PromptPlugin {
  dependencies = [LocalStoragePlugin, GlobalStoragePlugin]

  async init ({ localStorage, globalStorage }) {
    this._localStorage = localStorage
    this._globalStorage = globalStorage
  }

  instance () {
    return {
      prompt: async questions => {
        const newQuestions = questions
          .filter(q => this._localStorage[q.name] === undefined)
          .map(question => {
            if (question.store === true) {
              question = {
                ...question,
                default: this._globalStorage[question.name]
              }
              delete question.store
            }

            return question
          })

        const answers = await inquirer.prompt(newQuestions)
        Object.assign(this._globalStorage, ...questions
          .filter(q => q.store === true)
          .filter(q => answers[q.name] !== undefined)
          .map(q => ({ [q.name]: answers[q.name] }))
        )
        Object.assign(this._localStorage, answers)

        return Object.fromEntries(questions.map(q => [q.name, this._localStorage[q.name]]))
      }
    }
  }
}
