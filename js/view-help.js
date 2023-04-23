export const viewHelp = () => ({
  helpText: '',

  async init() {
    this.helpText = await fetch('help.txt').then((res) => res.text())
  },
})
