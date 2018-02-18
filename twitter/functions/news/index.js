'use strict'

const twitter = require('twitter');
const aws = require('aws-sdk');
const hangul = require('hangul-js');
const { WebClient } = require('@slack/client');

exports.handle = function(e,ctx,cb) {

	// slack bot token, #slack bot pm
	const token = process.env.BOT_TOKEN;
	const web = new WebClient(token);
	const channelId = 'D93AU3S3E';
	
	//twitter app
	var client = new twitter({
		consumer_key: process.env.TWITTER_CONSUMER_KEY,
		consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
		access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
		access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
	});

	//dynamodb settings
	aws.config.update({
		region: "ap-northeast-1"
	});
	var dynamodb = new aws.DynamoDB.DocumentClient();


	dynamodb.scan({TableName: "lastestNews"}, (err, data) => {
		if(err) console.error(err);
		else {
			var params = {
				screen_name: 'JTBC_news',
				since_id: data["Items"][0]["tweetId"]
			}
			client.get('statuses/user_timeline', params, (error, tweets, response) => {
				if(error) console.log('There was an error in twitter api', error);
				else {
					if(tweets.length > 0) {
						var param = {
							TableName: "lastestNews",
							UpdateExpression: "set tweetId = :i",
							ExpressionAttributeValues: {
								":i":tweets[0]["id_str"]
							},
							Key:{
								"id":"1"
							}
						};
						dynamodb.update(param, (err, data) => {
							if(err) console.log('Unable to update item', err);
							else console.log('Update succeeded!');
						});

						//정규식으로 속보 체크
						var check = '속보';
						tweets.forEach((tweet, index, array) => {
							if(hangul.rangeSearch(tweet["text"], check).length !== 0) {
								web.chat.postMessage(channelId, "새로운 속보가 도착했습니다!\n" + tweet["text"], {
									"link_names":true
								}).then((res) => {
									console.log("Message successfully sent on slack!");
								}).catch(console.error);
							}
						});
					}
				}
			});
		}
	});
	
	cb(null, "성공!!");
}
