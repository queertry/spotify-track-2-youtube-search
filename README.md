# Spotify Track to YouTube Search

This addon enables you to drag and drop a spotify track onto the YouTube search bar and have it automatically seach for that track. It will also work if you copy and paste the track's share link.

## Disclaimer

This addon is not available anywhere else but here. I have not uploaded it to any official addon store or had any official team review the code. If you choose to install it, you do so at your own risk.

I have only tested the addon in Firefox Developer Version, version 149.0b2.

## Settings

You can change your settings by left-clicking on the extension in your browser's toolbar.

| Name | Type | Default | Description 
|------|------|---------|------------
| Drop anywhere | boolean | false | Allows you to drop the track link anywhere on the YouTube page instead of only over the search bar.
| Use cache | boolean | true | Toggles the cache functionality

## Installation

Since this addon is unsigned you can only install it temporarily in a standard version of Firefox. To install it permanently, you must use either the Firefox Developer Version, a nightly version or the ESR build.

Below are outlined the steps for installation in Firefox, other browsers likely have a similar installation process, though
1. Install one of the above mentioned Firefox browsers
1. Browse to `about:config`
1. Search up the setting `xpinstall.signatures.required` and set it to `false`
1. Restart Firefox
1. Download the .xpi file from the latest release of this addon and either  
  a) drag and drop the file anywhere onto your browser  
  b) go to `about:addons` and use the cogwheel in the top right to `Install Add-On from File`

## Attribution

The loading icon found at [src/icons/library/loading.js](https://github.com/queertry/spotify-track-2-youtube-search/blob/main/src/icons/library/loading.js) is from [Animated SVG Preloaders by SVGBackgrounds.com](https://www.svgbackgrounds.com/elements/animated-svg-preloaders/). Thank you for the great icon!
