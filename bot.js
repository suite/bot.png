console.log('The follow bot is starting');

var Twit = require('twit');
var fs = require('fs');
var config = require('./config');
var T = new Twit(config);
var whatitsaid = "hey buddy"
var Scraper = require('images-scraper'),
    bing = new Scraper.Bing();

var imageUrl = "https://pbs.twimg.com/media/CshHnqQVYAARZmM.jpg";

function bingSearch(search, eventMsg) {
    console.log("logging " + search);
    bing.list({
            keyword: search,
            num: 10,
            detail: true
        })
        .then(function(res) {
            console.log('url: ', res[0].url);
            imageUrl = res[0].url;
            gotImageUrl(imageUrl, eventMsg);
        }).catch(function(err) {
            console.log('err', err);
        })
    console.log("returning " + imageUrl)
    return imageUrl;
}

function gotImageUrl(theurl, eventMsg) {
    console.log("Hi I got a url called " + theurl);
    loadBase64Image(theurl, function(image, prefix) {
        // first we must post the media to Twitter
        T.post('media/upload', {
            media_data: image
        }, function(err, data, response) {
            // now we can assign alt text to the media, for use by screen readers and
            // other text-based presentations and interpreters
            var mediaIdStr = data.media_id_string
            var altText = "Small flowers in a planter on a sunny balcony, blossoming."
            var meta_params = {
                media_id: mediaIdStr,
                alt_text: {
                    text: altText
                }
            }

            T.post('media/metadata/create', meta_params, function(err, data, response) {
                if (!err) {
                    // now we can reference the media and post a tweet (media will attach to the tweet)
                    var params = {
                        status: "@" + eventMsg.user.screen_name + " " + whatitsaid,
                        media_ids: [mediaIdStr]
                    }

                    T.post('statuses/update', params, function(err, data, response) {

                    })
                }
            })
        })
    });
}

var stream = T.stream('statuses/filter', {
  //track every tweet with the chars png
    track: 'png'
})

//when it actually happens
stream.on('tweet', tweetEvent);

function tweetEvent(eventMsg) {
    var replyTo = eventMsg.in_reply_to_screen_name;
    var text = eventMsg.text;
    var fromTo = eventMsg.user.screen_name;
    if (eventMsg.text.indexOf(".png") !== -1) {
        if (eventMsg.text.indexOf("@botdotpng") !== -1) {
            var startnumber = eventMsg.text.indexOf(".png");
            while (startnumber > 0 && eventMsg.text[startnumber] != ' ') {
                startnumber--;
            }
            if (eventMsg.text[startnumber] === ' ') {
                startnumber += 1;
            }
            whatitsaid = eventMsg.text.substring(startnumber, eventMsg.text.indexOf(".png"));
            console.log(eventMsg.text.substring(startnumber, eventMsg.text.indexOf(".png")));

            bingSearch(eventMsg.text.substring(startnumber, eventMsg.text.indexOf(".png")), eventMsg);


        } else {
            console.log("yay not as good meme")

        }
    }




}
//Simply function to tweet out some text
function tweetIt(txt) {

    var tweet = {
        status: txt
    }

    T.post('statuses/update', tweet, tweeted);

    function tweeted(err, data, response) {
        if (err) {
            console.log("Something went wrong!");
            console.log(err);
        } else {
            console.log("It worked!");
        }
    }
}

function loadBase64Image(url, callback) {
    // Required 'request' module
    var request = require('request');

    // Make request to our image url
    request({
        url: url,
        encoding: null
    }, function(err, res, body) {
        if (!err && res.statusCode == 200) {
            // So as encoding set to null then request body became Buffer object
            var base64prefix = 'data:' + res.headers['content-type'] + ';base64,',
                image = body.toString('base64');
            if (typeof callback == 'function') {
                callback(image, base64prefix);
            }
        } else {
            throw new Error('Can not download image');
            console.log(err);
        }
    });
};
