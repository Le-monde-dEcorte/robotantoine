import { colorRole } from '../../config/lists'
import {
	ActionRow,
	ButtonComponent,
	ButtonStyle,
	SelectMenuComponent,
	UnsafeSelectMenuOption,
	Util
} from 'discord.js'
import { Embed } from '@discordjs/builders'
import { config } from '../../config/config'
import { inspect } from 'util'

module.exports = {
	name: 'messageCreate',
	once: false,

	async execute(message, client) {
		if (message.author.id !== '324281236728053760') return
		const content = message.content.split(' ')
		const cmd = content[0]
		if (!cmd.startsWith(config.prefix)) return
		switch (cmd.slice(1)) {
			case 'color_message_setup': {
				const roleArray: string[] = []
				colorRole.forEach((rolename) => {
					const role = message.guild.roles.cache.find(
						(role) => role.name === rolename
					)
					const rolePingString = `<@&${role.id}>\n`
					roleArray.push(rolePingString)
				})
				const displayRoleString = roleArray.join(' ')
				const embed = new Embed()
					.setColor(Util.resolveColor('#36393f'))
					.setTitle('Choix de couleur.')
					.setDescription(
						'Clique sur un bouton pour avoir la couleur de ton choix.'
					)
					.addField({
						name: 'Rôle de couleur',
						value: displayRoleString,
						inline: true
					})

				const colorOptions = [
					{
						label: 'Aucune couleur',
						value: 'nothing'
					},
					{
						label: 'Maya',
						value: 'Maya'
					},
					{
						label: 'Mikado',
						value: 'Mikado'
					},
					{
						label: 'Rose',
						value: 'Rose'
					},
					{
						label: 'Lavender',
						value: 'Lavender'
					},
					{
						label: 'Coral',
						value: 'Coral'
					},
					{
						label: 'Cantaloupe',
						value: 'Cantaloupe'
					},
					{
						label: 'Mint',
						value: 'Mint'
					},
					{
						label: 'Weed',
						value: 'Weed'
					},
					{
						label: 'Smoked',
						value: 'Smoked'
					}
				]

				const row = new ActionRow().addComponents(
					new SelectMenuComponent()
						.setCustomId('color_role_selects')
						.setPlaceholder('Aucune couleur')
						.addOptions(
							...colorOptions.map(
								(option) => new UnsafeSelectMenuOption(option)
							)
						)
				)
				message.channel.send({ embeds: [embed], components: [row] })
				break
			}
			case 'compilevote': {
				const userVote = {}

				const findHighest = (obj) => {
					const values = Object.values(obj)
					// eslint-disable-next-line prefer-spread
					const max = Math.max.apply(Math, values)
					for (const key in obj) {
						if (obj[key] === max) {
							return [key, max]
						}
					}
				}

				const docs = await client.prisma.mondecorte.findMany()
				docs.forEach(async (doc) => {
					if (doc.vote) {
						if (userVote[doc.vote]) {
							userVote[doc.vote] = userVote[doc.vote] + 1
						} else {
							userVote[doc.vote] = 1
						}
					}
				})

				message.channel.send(`The highest vote is ${findHighest(userVote)[0]}`)
				break
			}
			case 'eval': {
				const codetoeval = message.content.split(' ').slice(1).join(' ')
				try {
					if (
						codetoeval.includes(
							`token` ||
								`env` ||
								`message.channel.delete` ||
								`message.guild.delete` ||
								`delete`
						)
					) {
						return message.channel.send(`no`)
					}

					const evalOutputEmbed = new Embed()
						.setTitle('Evaluated Code')
						.addField({
							name: `:inbox_tray: **Input**`,
							value: `\`\`\`js\n${codetoeval}\`\`\``
						})

					try {
						const output = await eval(`(async () => {${codetoeval}})()`)
						if (
							await inspect(output).includes(
								config.token || 'message.channel.delete()'
							)
						) {
							return message.channel.send(`no`)
						}

						if (inspect(output, { depth: 0 }).length > 1000) {
							return
						} else {
							evalOutputEmbed.addField({
								name: `:outbox_tray: **Output**`,
								value: `\`\`\`js\n${inspect(output, { depth: 0 })}\`\`\``
							})
						}
						await message.channel.send({ embeds: [evalOutputEmbed] })
					} catch (e) {
						const output = e.message
						if (
							inspect(output).includes(
								config.token || 'message.channel.delete()'
							)
						) {
							return message.channel.send(`no`)
						}

						if (inspect(output, { depth: 0 }).length > 1000) {
							return
						} else {
							evalOutputEmbed.addField({
								name: `:outbox_tray: **Error**`,
								value: `\`\`\`js\n${inspect(output, { depth: 0 })}\`\`\``
							})
						}
						await message.channel.send({ embeds: [evalOutputEmbed] })
						await client.logger.error(e)
					}
				} catch (err) {
					client.logger.error(err)
				}
				break
			}
			case 'setupVote': {
				const maire = []

				const userslol = [
					'762383326018928642',
					'307965162705649664',
					'696613917765533746',
					'377944202710876161',
					'285502356811022336',
					'302793054962581505',
					'280056504604819457'
				]

				userslol.forEach(async (user) => {
					await message.guild.members
						.fetch(user, { force: true })
						.then(async (member) => {
							maire.push({
								value: member.user.id,
								label: member.user.tag
							})
						})
				})

				if (maire.length === 0) message.channel.send(':poop:')
				const embed = new Embed()
					.setColor(Util.resolveColor('#36393f'))
					.setAuthor({
						name: message.guild.name,
						iconURL: message.guild.iconURL
					})
					.setTitle('Élection du maire du serveur')
					.setDescription(
						"Va lire les candidatures dans <#944033597583679508>.\nEnsuite, sélectionner la personne que vous voulez voter.\nVous ne pouvez voter qu'une fois et une personne."
					)
					.setTimestamp()

				const row = new ActionRow().addComponents(
					new SelectMenuComponent()
						.setCustomId('vote')
						.setPlaceholder('Aucun vote')
						.setMaxValues(1)
						.setMinValues(1)
						.addOptions(
							...maire.map((option) => new UnsafeSelectMenuOption(option))
						)
				)

				await message.channel.send({
					embeds: [embed],
					components: [row]
				})
				break
			}
			case 'welcomeMessage': {
				const message1 = `:round_pushpin:  **Bienvenue sur Le monde d'Ecorte**

<:ChannelRules:879457614835097660> **Règlements**

1. Respectez tout le monde, qu'ils soient d'accord ou non avec vous. Réglez vos propres problèmes avec les utilisateurs en dehors de ce serveur.
2. Pas de publicité sur le serveur ou via DMs.
3. Pas de contenu NSFW.
4. Respecter les tos de discord <https://dis.gd/terms> <https://dis.gd/guidelines>

<:IconRole:879457634644811839> **Rôles assignable**

>   <@&879465272669528098> (Annonce) - Pour être notififier lors d'annonce.
>   <@&879465303795466240> (Free Stuff) - Pour être notififier lors d'un jeux gratuit.
>   <@&879465436922642462> (Giveaway) - Pour être notififier lors d'un giveaway.
`

				const pinOptions = [
					{
						label: 'Annonce',
						value: '879465272669528098'
					},
					{
						label: 'Free Stuff',
						value: '879465303795466240'
					},
					{
						label: 'Giveaway',
						value: '879465436922642462'
					}
				]

				const roleSelect = new ActionRow().addComponents(
					new SelectMenuComponent()
						.setCustomId('ping_role_selects')
						.setPlaceholder(
							'Clique ici pour choisir un ou des rôles de notification'
						)
						.setMaxValues(3)
						.setMinValues(0)
						.addOptions(
							...pinOptions.map((option) => new UnsafeSelectMenuOption(option))
						)
				)

				const ruleMessage = await message.channel.send({
					content: message1,
					components: [roleSelect]
				})

				const roleArray: string[] = []
				colorRole.forEach((rolename) => {
					const role = message.guild.roles.cache.find(
						(role) => role.name === rolename
					)
					const rolePingString = `<@&${role.id}>`
					roleArray.push(rolePingString)
				})
				const displayRoleString = roleArray.join('\n> ')

				const message2 = `<:IconRole:879457634644811839> **Rôles de couleur** - (<@&857324294791364639> seulement)

Voici les rôles de couleur que vous pouvez assigner à vous-même:
> ${displayRoleString}
`

				const options = [
					{
						label: 'Aucune couleur',
						value: 'nothing'
					},
					{
						label: 'Maya',
						value: 'Maya'
					},
					{
						label: 'Mikado',
						value: 'Mikado'
					},
					{
						label: 'Rose',
						value: 'Rose'
					},
					{
						label: 'Lavender',
						value: 'Lavender'
					},
					{
						label: 'Coral',
						value: 'Coral'
					},
					{
						label: 'Cantaloupe',
						value: 'Cantaloupe'
					},
					{
						label: 'Mint',
						value: 'Mint'
					},
					{
						label: 'Weed',
						value: 'Weed'
					},
					{
						label: 'Smoked',
						value: 'Smoked'
					}
				]

				const colorRow = new ActionRow().addComponents(
					new SelectMenuComponent()
						.setCustomId('color_role_selects')
						.setPlaceholder('Clique ici pour choisir un rôle de couleur')
						.addOptions(
							...options.map((option) => new UnsafeSelectMenuOption(option))
						)
				)

				await message.channel.send({
					content: message2,
					components: [colorRow]
				})

				const message3 = `
<:IconRole:879457634644811839> **Rôles** - (Ne pas demander pour des rôles)

>   <@&852883842292645919> (Modérateur) - Ils voit tout.
>   <@&842387653394563074> (Actif) - Personne qui sont actif sur le serveur.
>   <@&721741773864435722> (IRL) - Amis IRl de Ecorte.
>   <@&850137999479537724> (\\💜) - Amis de Ecorte.
>   <@&857324294791364639> (Colorful) - Rôle qui permet d'avoir un rôle de couleur.
`

				await message.channel.send({ content: message3 })
				const message4 = `

<:IconSearch:879459997824716800> **FAQ**

**A quoi servent les points ?**
Les points servent a montrer votre activité sur le serveur. Si tu a 100 points tu gagne le rôle <@&842387653394563074> (Actif) tu le perd si tu va en bas de 50 points.

**Comment gagner des points ?**
Tu peux gagner des points en parlant sur le serveur. Que sa soit en vocal ou en textuel. Tu gagne un point par message/minutes. Tu gagnes 1 point par 5 minutes en vocal.
Si tu a moins de 1000 points, tu perds 1 point par heure. Si tu a plus de 1000 points fait la commande \`\`/points rewards\`\` pour voir combien de points tu perd par heure.

**Comment avoir un rôle custom ?**
Pour avoir un rôle custom tu doit avoir au dessus de 250 points. Tu perd ton rôle custom a 200 points. Pour plus d'information faites la commandes \`\`/points rewards\`\`.
`

				await message.channel.send({ content: message4 })

				const message5 = `:round_pushpin: **Comment avoir accès au serveur ?**
Pour avoir accès au serveur tu doit appuyer sur le bouton ci-dessous.`

				const accessButton = new ActionRow()
					.addComponents(
						new ButtonComponent()
							.setCustomId('acces_role')
							.setLabel("J'ai lu et j'accepte les règlements")
							.setStyle(ButtonStyle.Success)
							.setEmoji({ name: '✅' })
					)
					.addComponents(
						new ButtonComponent()
							.setLabel('Aller en haut')
							.setStyle(ButtonStyle.Link)
							.setURL(
								`https://discord.com/channels/${message.guild.id}/${message.channel.id}/${ruleMessage.id}`
							)
							.setEmoji({ name: '⬆️' })
					)

				await message.channel.send({
					content: message5,
					components: [accessButton]
				})
				break
			}
			case 'removeAllVote': {
				await client.prisma.mondecorte.updateMany({
					data: {
						vote: null
					}
				})
				break
			}
			case 'spookyMessage': {
				const embed = new Embed()
					.setColor(Util.resolveColor('#f4900c'))
					.setDescription('Spooky rôle.')
				const row = new ActionRow().addComponents(
					new ButtonComponent()
						.setLabel('Spooky')
						.setStyle(ButtonStyle.Primary)
						.setEmoji({ name: '🎃' })
						.setCustomId('spooky')
				)

				await message.channel.send({ embeds: [embed], components: [row] })

				break
			}
			case 'revo': {
				const embed = new Embed()
					.setColor(Util.resolveColor('#36393f'))
					.setDescription(
						'Certain membres du serveurs du serveur ne sont pas content du gouvernement actuel.\n\nUne révolution se prépare.\nCliquer sur le bouton vert si-dessous pour la rejoindre.'
					)
					.setImage(
						'https://cdn.discordapp.com/attachments/747923748564500490/941121332819681340/erguhniilaeuhgriuhaegrierguh.png'
					)
					.setThumbnail(
						'https://cdn.discordapp.com/attachments/436249478521946191/941122330749435914/2.png'
					)
				const row = new ActionRow().addComponents(
					new ButtonComponent()
						.setLabel('Rejoindre la révolution.')
						.setStyle(ButtonStyle.Success)
						.setEmoji({ name: '✅' })
						.setCustomId('revo:join')
				)

				await message.channel.send({
					embeds: [embed],
					components: [row]
				})
			}
		}
	}
}
