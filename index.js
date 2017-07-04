const express = require('express')
const request = require('request')
const bodyParser = require('body-parser')
const botly = require('botly')

const { WEBHOOK, VERIFY_TOKEN, ACCESS_TOKEN, REPLY_URL } = require('../configs').FBBOT


const app = express()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));


const bot = new botly({
    verifyToken: VERIFY_TOKEN,
    accessToken: ACCESS_TOKEN
})

let profiles = {}

const reply = (sender, message, data) => {
	const payload = {
		sender: sender,
		message: message,
		data: data
	}
	request.post({
		url: REPLY_URL,
		body: payload
	}, (res, req, body) => {
		if (err) {
			console.log(err)
		} else {
			const data = JSON.parse(body)
			const sender = data.user
			const name = profiles[sender].first_name
			const type = data.type
			switch (type) {
				scase 'text':
				default:
					bot.sendText({
						id: sender,
						text: data.text
					}, (e,d) => {
						if (e) console.log('sendText error:', e)
						else console.log('sendText callback:', d)
					})
			}
		}
	})

}

bot.on('message', (sender, message, data) => {
    console.log('sender:',sender)
    console.log('message:',message)
    console.log('data:',data)

	if (profiles[sender]) {
		reply(sender, message, data)
	} else {
		// first-time user
		bot.getUserProfile(sender, (err, info) => {
			if (err) { 
				console.log('getUserProfile error:', err)
			} else {
				profiles[sender] = info
				bot.sendText({
					id: sender,
					text: 'Hello~'+profiles[sender].first_name
				}, (e, d) => {
					if (e) {
						console.log('sendText error:', e)
					} else {
						console.log('sendText callback:', d)
						reply(sender, message, data)
					}
				})
			}
		})
	}

})

app.use(WEBHOOK, bot.router())

app.listen(process.env.PORT || 8080)
