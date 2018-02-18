'use strict'

const request = require('request');
const twitter = require('twitter');
var aws = require('aws-sdk');
const { WebClient } = require('@slack/client');

//slack part

exports.handle = function(e,ctx,cb) {

	const token = process.env.BOT_TOKEN;
	const web = new WebClient(token);
	const channelId = 'D93AU3S3E';
	
	var client = new twitter({
		consumer_key: process.env.TWITTER_CONSUMER_KEY,
		consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
		access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
		access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
	});

	aws.config.update({
		region: "ap-northeast-1"
	});

	var dynamodb = new aws.DynamoDB.DocumentClient();

	var params = {screen_name: '_Jjungs', count:1};
	client.get('statuses/user_timeline', params, function(error, tweets, response) {
		if(!error) {
			var lastTweet = tweets[0]["text"];
			var lastTweetTime = tweets[0]["created_at"];
			var param = {
			    TableName: "gamsi",
			    Key: {
			    	"id": 1
			    }
			};
			dynamodb.get(param, function(err, data) {
				if(err) { console.error("Unable to load item. Error.", err); }
				else {
					if((lastTweet != data["Item"]["last_tweet"]) || (lastTweetTime != data["Item"]["last_tweet_time"])) {
						param = {
							TableName: "gamsi",
							Item: {
								"id": 1,
								"last_tweet": lastTweet,
								"last_tweet_time": lastTweetTime
							}
						}
						dynamodb.put(param, function(err, data) {
							if(err) { console.error("Unable to add item. Error.", err); }
							else { console.log("Added item"); }
						});
						web.chat.postMessage(channelId, "@_Jjungs New tweet from 양정일!!!\n" + lastTweet, {
							"link_names":true
						}).then((res) => {
							// nothing to send
						}).catch(console.error);
					} else {
						console.log("No new tweets");
					}
				}
			});
		}
	});

	cb(null, "성공!!");
}
