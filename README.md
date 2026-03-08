# Spotify Track to YouTube Search

This addon enables you to drag and drop a Spotify track onto the YouTube or YouTube Music search bar and have it automatically search for that track. It will also work if you copy and paste the track's share link.

## Disclaimer

This addon is not available anywhere else but here. I have not uploaded it to any official addon store or had any official team review the code. If you choose to install it, you do so at your own risk.

I have only tested the addon in Firefox Developer Version, version 149.0b2.

## Settings

You can change your settings by left-clicking on the extension in your browser's toolbar.

| Name | Type | Default | Description 
|------|------|---------|------------
| Drop anywhere | boolean | false | Allows you to drop the track link anywhere on the YouTube page instead of only over the search bar.
| Use cache | boolean | true | Caches resolved track info for quicker lookups. Entries expire after 30 days.
| Open in new tab | boolean | false | When true, all track queries will be done in a new tab. Even if false, the query will run in a new tab if the SHIFT key is held while pasting or dropping the track link.
| Prefer smooth search | boolean | true | When this is true, the code will prioritize a smoother search (one that does not require a page reload) even if that means waiting a few milliseconds for YouTube to load some necessary data. If you have a very fast internet connection, leaving this on could result in a *slightly* slower search.

## Accessibility

I've tried keeping accessibility in mind when developing this addon, however I might of course miss something or do something wrong somewhere, so
accessibility related feedback is very welcome!

Below is a table of accessibility-oriented settings.

| Name | Type | Default | Description
|------|------|---------|------------
| Toast duration | Dropdown | 5 seconds | Controls the amount of time any toast messages (currently just error messages) are displayed for before being automatically dismissed. A close button to manually dismiss the toast is always available.

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

## For Development

### Creating a build

To create a build of this addon, run the [build.sh](https://github.com/queertry/spotify-track-2-youtube-search/blob/main/build.sh) script. It has a few dependencies that may not be installed by default on your system. They are the following:

* [esbuild](https://esbuild.github.io/) - used to bundle and minify the js files. The build script itself will also help you install it if necessary.
* [jq](https://jqlang.org/) - used to parse and edit the manifest.json file. This can usually be installed via a standard package manager, like `apt`
* `zip` - used to create the final .xpi file. This can also usually be installed via a standard package manager, like `apt`
