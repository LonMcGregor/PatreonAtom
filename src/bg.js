const PATREON_URL = "https://www.patreon.com/api/stream?\
include=user%2Cattachments%2Cpoll.choices%2Cimages.null%2Caudio.null\
&fields[post]=\
content%2Cembed%2Cimage%2Cpost_file%2Cpost_metadata%2Cpublished_at%2Cpatreon_url%2Cpost_type%2Ctitle%2Curl\
&fields[user]=full_name%2Curl\
&fields[media]=id%2Cimage_urls%2Cdownload_url%2Cmetadata%2Cfile_name\
&page[cursor]=null\
&filter[is_following]=true\
&json-api-use-default-includes=false\
&json-api-version=1.0";

const XML_STRING = `<!--?xml version="1.0" encoding="UTF-8"?-->`;

// fields for each type of content as well as the details required, as indicated by "include"
// cursor would be the update date of the last item on a "page"

function makeAnEntry(id, time, author, authoruri, link, title, summary){
    return `<entry><id>tag:patreon.com,2021:${id}</id>
    <updated>${time}</updated>
    <author>
      <name>${author}</name>
      <uri>${authoruri}</uri>
    </author>
    <link rel="alternate" type="text/html" href="${link}"></link>
    <title>${title}</title>
    <summary type="html"><![CDATA[${summary}]]></summary>
    </entry>`;
}

function removeXMLChars(input){
    return input.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;").replace("'", "&apos;");
}

function getIncluded(data, id){
    return data.find(x => x.id===id);
}

function generateSummary(data, included){
    let summary = "<h1>" + data.attributes.title + "</h1>";
    const relationships = data.relationships;
    relationships.attachments.data.forEach(a => { // []
        const attachment = getIncluded(included, a.id);
        summary += `<br>Attachment: <a href="${attachment.download_url}">${attachment.file_name}</a>`;
    });
    if(relationships.audio.data){ // null or object
        const attachment = relationships.audio.data;
        summary += `<br>Attachment: <a href="${attachment.download_url}">${attachment.file_name}</a>`;
    }
    relationships.images.data.forEach(a => { // []
        const attachment = getIncluded(included, a.id);
        summary += `<br><img height=${attachment.attributes.metadata.dimensions.h} width=${attachment.attributes.metadata.dimensions.w} src="${attachment.attributes.image_urls.original}">`;
    });
    if(relationships.poll.data){ // null or object
        summary += `<h2>This post has a poll.</h2>"`;
    }
    if(data.attributes.embed){ // null or object
        summary += "<br>";
        summary += data.attributes.embed.html;
    }
    summary += "<br>";
    summary += data.attributes.content;
    return summary;
}

function processOnePost(data, included){
    const authorid = data.relationships.user.data.id;
    const author = getIncluded(included, authorid);
    return makeAnEntry(
        "post" + data.id, // an incrementing number in the form 00000000
        data.attributes.published_at, // e.g. 2021-05-04T14:27:09.000+00:00
        removeXMLChars(author.attributes.full_name), // Text
        author.attributes.url, // https://www.patreon.com/whatever
        data.attributes.url, // "https://www.patreon.com/posts/whatever-00000000"
        removeXMLChars(data.attributes.title), //  text
        generateSummary(data, included) // HTML
    );
}

function downloadPage(xml){
    const textfile = new File([xml], "PatreonAtom.atom", {type: "text/atom"});
    chrome.downloads.download({
        url: window.URL.createObjectURL(textfile),
        filename: "PatreonAtom.atom",
        conflictAction: "overwrite",
        saveAs: false
    });
    // download was started. does not mean it completed.
    const today = new Date().getDay();
    chrome.storage.local.set({"lastrun": today});
}

function createInMemoryPage(data){
    const head = XML_STRING +`
    <feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">
        <id>tag:patreon.com,2021:feed/patreon.com/</id>
        <title>Patreon Atom User Feed</title>
        <icon>https://c5.patreon.com/external/favicon/favicon-32x32.png</icon>
        <subtitle>Your Patreon subscriptions as an Atom feed</subtitle>
        <logo>https://c5.patreon.com/external/favicon/apple-touch-icon.png</logo>`;
    let body = `<updated>`+new Date().toISOString()+`</updated>`;
    data.data.forEach(post => {
        body += "\n" + processOnePost(post, data.included);
    });
    const tail = `</feed>`;
    return head + body + tail;
}

function workInBackground(){
    chrome.storage.local.get({"lastrun": 99999999}, details => {
        const lastrun = details["lastrun"];
        const today = new Date().getDay();
        console.log("Running. Last: " + lastrun + " today: " + today);
        // don't run if it already ran today
        if(today !== lastrun) {
            fetch(PATREON_URL)
            .then(response => response.json())
            .then(createInMemoryPage)
            .then(downloadPage);
        } else {
            // an alarm? I'm assuming i don't keep my browser opne all the time...
        }
    });
}

if(window.location.pathname==="/atom.xml"){
    // running in a tab
    workInBackground();
} else {
    // else running in background page
    chrome.runtime.onStartup.addListener(workInBackground);
    chrome.runtime.onInstalled.addListener(workInBackground);
}
