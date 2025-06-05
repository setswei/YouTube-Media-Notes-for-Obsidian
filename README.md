# YouTube Media Notes for Obsidian

A browser extension that creates media notes from YouTube videos with timestamps in your Obsidian vault.

![YouTube Media Notes for Obsidian](https://github.com/yourusername/obsidian_youtube_note_clipper/raw/main/assets/screenshot.png)

## Features

- **One-Click Note Creation**: Create notes from YouTube videos with a single click
- **Automatic Timestamp Extraction**: Extract timestamps/chapters from video descriptions
- **Timestamp Table Format**: Timestamps are formatted as a clean, clickable table in your notes
- **Custom Templates**: Customize note templates with variables for URL, title, tags, and timestamps
- **Vault Organization**: Choose your preferred Obsidian vault and folder structure
- **Dark Mode Support**: UI automatically adapts to your system's light/dark mode preference
- **User-Friendly Settings**: Easy-to-use settings page for customization

## Installation

### Firefox

1. Download the latest release from the [Firefox Add-ons Store](https://addons.mozilla.org/en-US/firefox/addon/youtube-media-notes-obsidian/)
2. Click "Add to Firefox"

### Manual Installation (Developer Mode)

1. Download the latest release from the [Releases page](https://github.com/yourusername/obsidian_youtube_note_clipper/releases)
2. In Firefox, navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on" and select any file from the unzipped extension folder

## Usage

1. Navigate to a YouTube video
2. Click the extension icon in your browser toolbar
3. Click "Add to Obsidian" to create a note with the current timestamp
4. The note will be created in your Obsidian vault with video information and timestamps

### Settings

Access the extension settings by:
1. Clicking the extension icon
2. Selecting "Settings"

Available settings:
- **Vault Name**: Specify which Obsidian vault to use (leave empty for default)
- **Folder Path**: Set the folder path within your vault for storing notes
- **Title Prefix**: Add a prefix to note titles (e.g., "Video: ")
- **Tags**: Define default tags for your notes
- **Note Template**: Customize the note template with variables
- **Auto-close Delay**: Set how quickly the extension returns to YouTube after creating a note

## Template Variables

The following variables can be used in your note template:

- `{{url}}` - The YouTube URL with timestamp
- `{{title}}` - The video title
- `{{tags}}` - Your custom tags
- `{{timestamp}}` - The current timestamp in seconds

## Timestamps Format

Timestamps are automatically extracted from the video description and added to your note in a table format:

```markdown
## Timestamps

| Time | Chapter |
|------|--------|
| [0:00](https://youtube.com/watch?v=videoId&t=0) | Introduction |
| [1:30](https://youtube.com/watch?v=videoId&t=90) | Main Topic |
| [5:45](https://youtube.com/watch?v=videoId&t=345) | Conclusion |
```

## Requirements

- Firefox browser
- Obsidian installed with the ability to handle obsidian:// protocol links

## Development

### Prerequisites

- Firefox Browser
- Basic knowledge of JavaScript, HTML, and CSS
- Git

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/obsidian_youtube_note_clipper.git
   cd obsidian_youtube_note_clipper
   ```

2. Load the extension in Firefox:
   - Navigate to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from the project directory

3. Make changes to the code and reload the extension to test

### Project Structure

- `background.js` - Background script for handling extension button clicks
- `content.js` - Content script that runs on YouTube pages to extract video information
- `popup.html/js` - Popup UI that appears when clicking the extension icon
- `options.html/js` - Settings page for customizing the extension
- `styles.css` - Global styles for the extension UI
- `manifest.json` - Extension configuration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the need to take better notes while watching educational YouTube content
- Built for the Obsidian community
- Special thanks to [jemstelos](https://github.com/jemstelos) for creating the [obsidian-media-notes](https://github.com/jemstelos/obsidian-media-notes) plugin, which this extension is designed to complement by embedding videos into Obsidian notes

---

Made with ❤️ for Obsidian users and YouTube learners
