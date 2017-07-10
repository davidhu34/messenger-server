const express = require('express')
const request = require('request')
const bodyParser = require('body-parser')
const botly = require('botly')

const { WEBHOOK, VERIFY_TOKEN, ACCESS_TOKEN, CONVERSATION_URL, SIMILARITY_URL } = require('./configs')


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
	if (data.attachments && data.attachments.image) {
		request.post({
			url: SIMILARITY_URL,
			body: JSON.stringify({ url: data.attachments.image[0] })
		}, (res, req, body) => {
			const data = JSON.parse(body)
			const name = profiles[sender].first_name
			const similar_images = data.similar_images
			
			let elements = []
			for (let i=0; i<3; i++) {
				elements.push({
					image_url: similar_images[i].metadata.url,
					title: '藝人 : '+similar_images[i].image_file,
					subtitle: '相似度 : '+similar_images[i].score,
					item_url: similar_images[i].metadata.url,
					buttons: [{
						type: 'web_url',
						title: '照片',
						url: similar_images[i].metadata.url
					}]
				})
			}

			bot.sendText({
				id: sender,
				text: '以下是這張照片的相似圖'
			}, (e,d) => {
				if (e) console.log('sendText error:', e)
				else console.log('sendText callback:', d)
			})
			bot.sendGeneric({
				id: sender,
				elements: elements
			}, (e, d) => {				
				if (e) console.log('similarities error:', e)
				else console.log('similarities callback:', d)
			})
		})
	} else {	
		request.post({
			url: CONVERSATION_URL,
			body: JSON.stringify(payload)
		}, (res, req, body) => {
			const data = JSON.parse(body)
			const name = profiles[sender].first_name
			const type = data.type
			switch (type) {
				case 'weather':
				console.log('weather data:', data)
					bot.sendGeneric({
						id: sender,
						elements: [{
							image_url: data.image,
							title: data.disc+' | '+data.temp+'℃',
							subtitle: data.location,
						}] 	
					}, (e,d) => {
						if (e) console.log('sendText error:', e)
						else console.log('sendText callback:', d)
					})	
					break;
				case 'text':
				default:
					bot.sendText({
						id: sender,
						text: data.text
					}, (e,d) => {
						if (e) console.log('sendText error:', e)
						else console.log('sendText callback:', d)
					})
			}
		})
	}
}

bot.on('message', (sender, message, data) => {

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
