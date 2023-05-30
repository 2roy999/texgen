export default class PropertiesPlugin {
  dependencies = []

  instance () {
    this._properties = this._properties ?? {}

    return {
      getGlobalProperty: key => {
        return this._properties[key]
      },
      getAllGlobalProperties: () => {
        return { ...this._properties }
      },
      addGlobalProperty: (key, value) => {
        if (this._properties[key] !== undefined) {
          throw new Error(`Global property ${key} already exists`)
        }

        this._properties[key] = value.toString()
      }
    }
  }
}
