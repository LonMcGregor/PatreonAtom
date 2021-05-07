# Patreon ATOM

Get your patreon stuff as an atom feed
You need to be logged in

TODO:
* [x] Check if it can run in the background or if for reasons™ it needs to be in the foreground - I think it works?
* [ ] Hook vivaldi in so it looks at the rendered xml - pointing to URL just gives `chrome-extension://invalid/`
* [x] Generate real XML
* [ ] Test all attachment types. Right now only images and embeds tested
* [ ] security? ¯\_(ツ)_/¯
* [ ] If you ever get logged out, fire a notification to log the user back in

* [ ] Downloading a page in the background causes the file to automatically get a (1) appended to it the next time it urns - so that's not going to work
* [ ] doesn't work locally. vivaldi says `bundle.js:1 GET file:///C:/Users/l/Downloads/PatreonAtom.xml net::ERR_UNKNOWN_URL_SCHEME` when updating
