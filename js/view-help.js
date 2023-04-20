import { VERSION } from '../app.js'

export const viewHelp = () => ({
  content: `
  <div class="padded">
  <h1>JS Tracker v${VERSION}</h1>
  <h3>&copy; Ben Coleman, 2023 &mdash; <a href="https://github.com/benc-uk/js-tracker">github.com/benc-uk/js-tracker</a></h3>
  <table>
    <thead>
      <tr>
        <th>Key</th>
        <th>Action</th>
      </tr>
    </thead>
    <tr>
      <td style="width: 120px">Enter</td>
      <td>Play song from current pattern</td>
    </tr>
    <tr>
      <td>Ctrl + Enter</td>
      <td>Play & loop pattern from top</td>
    </tr>
    <tr>
      <td>Shift + Enter</td>
      <td>Play & loop pattern from current step</td>
    </tr>
    <tr>
      <td>Escape</td>
      <td>Stop playback</td>
    </tr>
    <tr>
      <td>Space</td>
      <td>Enter edit mode, will stop playback</td>
    </tr>
    <tr>
      <td>Delete</td>
      <td>Clear step (in edit mode)</td>
    </tr>
  </table>
</div>`,
})
