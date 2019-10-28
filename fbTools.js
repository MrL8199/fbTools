var fbTools = {
	conv: {
		query: (obj) => `?${Object.keys(obj).map((key) => `${key}=${obj[key]}`).join("&")}`,
		form: function(obj) { let f = new FormData(); Object.keys(obj).forEach((key) => {f.append(key, obj[key]);}); return f; }
	},
	fet: ({url, bdy}) => fetch(url, {method: "POST", credentials: "include", ...bdy}).then((res) => (String(res.status).match(/^2/g)) ? true : false),
	cmt: {
		add: async (obj) => { let f = { client_id: "1489983090155:3363757627", fb_dtsg: await fbTools.get.local().dtsg, session_id: "84d81e4", source: 2 }; Object.keys(obj).forEach((key) => { if (obj[key]) switch (key) { case "sticker": f.attached_sticker_fbid = obj[key]; break; case "post": f.ft_ent_identifier = obj[key]; break; case "cmt": f.comment_text = obj[key]; break; case "reply": f.reply_fbid = obj[key]; f.parent_comment_id = `${obj["post"]}_${obj[key]}`; break; case "url": f.attached_share_url = obj[key]; break; default: console.log(`Key: ${key} - Value: ${obj[key]} is not supported.`); break; }; }); return fbTools.fet({url: "https://www.facebook.com/ufi/add/comment/", bdy: {body: fbTools.conv.form(f)}}); },
		del: async (postId, cmtId) => fbTools.fet({ url: "https://www.facebook.com/ufi/delete/comment/", bdy: { body: fbTools.conv.form({ client_id: "1489983090155:3363757627", comment_id: `${postId}_${cmtId}`, comment_legacyid: cmtId, fb_dtsg: await fbTools.get.local().dtsg, ft_ent_identifier: postId, source: 2 }) } })
	},
	conversation: {
		changeNickname: async (id, nickName, threadId = id) => fbTools.fet({ url: "https://www.facebook.com/messaging/save_thread_nickname/?source=thread_settings", bdy: { body: fbTools.conv.form({ fb_dtsg: await fbTools.get.local().dtsg, nickname: nickName, participant_id: id, thread_or_other_fbid: threadId }) } }),
		changeEmoji: async (threadId, icon) => fbTools.fet({ url: "https://www.facebook.com/messaging/save_thread_emoji/?source=thread_settings", bdy: { body: fbTools.conv.form({ thread_or_other_fbid: threadId, emoji_choice: JSON.parse(`"${icon}"`), fb_dtsg: await fbTools.get.local().dtsg }) } }),
		chat: async (obj) => { let mId = Math.floor(Math.random() * 999999999), f = { action_type: "ma-type:user-generated-message", client: "mercury", ephemeral_ttl_mode: 0, fb_dtsg: await fbTools.get.local().dtsg, has_attachment: false, message_id: mId, offline_threading_id: mId, source: "source:titan:web", timestamp: Date.now() }; Object.keys(obj).forEach((key) => { if (obj[key]) switch(key) { case "thread": f.thread_fbid = obj[key]; break; case "message": f.body = obj[key]; break; case "sticker": f.has_attachment = true; f.sticker_id = obj[key]; break; case "user": f.other_user_fbid = obj[key]; break; case "kick": f.action_type = "ma-type:log-message"; f.log_message_type = "log:unsubscribe"; f["log_message_data[removed_participants][0]"] = `fbid:${obj[key]}`; break; case "img": f.has_attachment = true; (typeof(obj[key]) == "string" || typeof(obj[key]) == "number") ? f["image_ids[0]"] = obj[key] : (typeof(obj[key]) == "object") ? obj[key].forEach((id, item) => f[`image_ids[${item}]`] = id) : ""; break; case "audio": f["audio_ids[0]"] = obj[key]; break; case "video": f["video_ids[0]"] = obj[key]; break; case "emoji": f.body = JSON.parse(`"${obj[key]}"`); break; case "emoji_size": f["tags[0]"] = `hot_emoji_size:${obj[key]}`; break; default: console.log(`Key: ${key} - Value: ${obj[key]} is not supported.`); break; }; }); return fbTools.fet({url: "https://www.facebook.com/messaging/send/", bdy: {body: fbTools.conv.form(f)}}); },
		del: async (threadId) => fbTools.fet({ url: "https://www.facebook.com/ajax/mercury/delete_thread.php", bdy: { body: fbTools.conv.form({ "ids[0]": threadId, fb_dtsg: await fbTools.get.local().dtsg }) } }),
        typing: async (userId, typ) => fbTools.fet({ url: "https://www.facebook.com/ajax/messaging/typ.php", bdy: { body: fbTools.conv.form({ fb_dtsg: await fbTools.get.local().dtsg, source: "mercury-chat", thread: userId, to: userId, typ: typ }) } })
	},
	get: {
		local: () => ({ me: require("CurrentUserInitialData").USER_ID || document.cookie.match(/(?<=c_user=)\d+/g).pop(), dtsg: require("DTSGInitialData").token || document.querySelector('[name="fb_dtsg"]').value }),
		ids: (url) => fetch(url).then((res) => res.text()).then((res) => ({ postsId: res.match(/(?<=name="ft_ent_identifier"\svalue=")\d+(?=")/g), userId: res.match(/(?<=entity_id":")\d+(?=")/g), groupId: res.match(/(?<=membership_group_id:)\d+(?=,)/g), pageId: res.match(/(?<=page_id:")\d+(?=")/g) }))
	},
	group: {
		addMem: async (groupId, memberId) => fbTools.fet({ url: "https://www.facebook.com/ajax/groups/members/add_post/", bdy: { body: fbTools.conv.form({ "members[0]": memberId, fb_dtsg: await fbTools.get.local().dtsg, group_id: groupId, message_id: "groupsAddMemberCompletionMessage", source: "suggested_members_new" }) } }),
		create: async (groupName, privacy, discov, memIds) => { let f = { fb_dtsg: await fbTools.get.local().dtsg, ref: "discover_groups", "purposes[0]": "", name: groupName, privacy: privacy, discoverability: discov }; if (memIds) memIds.forEach((id, index) => {f[`members[${index}`] = id;}); return fbTools.fet({url: "https://www.facebook.com/ajax/groups/create_post/", bdy: {body: fbTools.conv.form(f)}}); },
		kick: async (groupId, memberId, block = 0) => fbTools.fet({ url: `https://www.facebook.com/ajax/groups/remove_member/${fbTools.conv.query({ group_id: groupId, is_undo: 0, member_id: memberId, source: "profile_browser" })}`, bdy: { body: fbTools.conv.form({ block_user: block, confirmed: true, fb_dtsg: await fbTools.get.local().dtsg }) } }),
		unban: async (groupId, memberId) => fbTools.fet({ url: `https://www.facebook.com/ajax/groups/admin_post/${fbTools.conv.query({ group_id: groupId, operation: "confirm_remove_block", source: "profilebrowser_blocked", user_id: memberId })}`, bdy: { body: fbTools.conv.form({ fb_dtsg: await fbTools.get.local().dtsg, remove_block: 1 }) } }),
		mute: async (groupId, memberId) => fbTools.fet({ url: "https://www.facebook.com/groups/mutemember/", bdy: { body: fbTools.conv.form({ fb_dtsg: await fbTools.get.local().dtsg, group_id: groupId, mute_duration: "seven_days", should_reload: false, source: "profile_browser", user_id: memberId }) } }),
		notification: async (groupId, level) => fbTools.fet({ url: `https://www.facebook.com/groups/notification/settings/edit/?group_id=${groupId}&subscription_level=${level}`, bdy: { body: fbTools.conv.form({ fb_dtsg: await fbTools.get.local().dtsg }) } }),
		leave: async (groupId, reAdd) => fbTools.fet({ url: `https://www.facebook.com/ajax/groups/membership/leave/?group_id=${groupId}`, bdy: { body: fbTools.conv.form({ confirmed: 1, fb_dtsg: await fbTools.get.local().dtsg, prevent_readd: (reAdd) ? "on" : "" }) } }),
		unfollow: async (groupId, follow) => fbTools.fet({ url: "https://www.facebook.com/groups/membership/unfollow_group/", bdy: { body: fbTools.conv.form({ group_id: groupId, unfollow: follow, fb_dtsg: await fbTools.get.local().dtsg }) } }),
		post: {
			del: async (groupId, postId) => fbTools.fet({ url: "https://www.facebook.com/ajax/groups/mall/delete/", bdy: { body: fbTools.conv.form({ confirmed: 1, fb_dtsg: await fbTools.get.local().dtsg, group_id: groupId, post_id: postId }) } }),
			disableCmt: async (postId, cmt) => fbTools.fet({ url: "https://www.facebook.com/feed/ufi/disable_comments/", bdy: { body: fbTools.conv.form({ fb_dtsg: await fbTools.get.local().dtsg, ft_ent_identifier: postId, disable_comments: cmt }) } }),
			offNotification: async (groupId, postId, follow) => fbTools.fet({ url: "https://www.facebook.com/ajax/litestand/follow_group_post", bdy: { body: fbTools.conv.form({ fb_dtsg: await fbTools.get.local().dtsg, group_id: groupId, message_id: postId, follow: follow }) } })
		}
	},
	friendRequest: async (userId, act) => fbTools.fet({ url: "https://www.facebook.com/requests/friends/ajax/", bdy: { body: fbTools.conv.form({ action: (act) ? "confirm" : "reject", fb_dtsg: await fbTools.get.local().dtsg, id: userId }) } }),
	me: {
		block: {
			page: async (pageId) => fbTools.fet({ url: "https://www.facebook.com/privacy/block_page/", bdy: { body: fbTools.conv.form({ confirmed: 1, fb_dtsg: await fbTools.get.local().dtsg, page_id: pageId }) } }),
			user: async (id) => fbTools.fet({ url: "https://www.facebook.com/ajax/privacy/block_user.php", bdy: { body: fbTools.conv.form({ confirmed: 1, fb_dtsg: await fbTools.get.local().dtsg, uid: id }) } })
		},
		unblock: async (userId) => fbTools.fet({ url: "https://www.facebook.com/privacy/unblock_user/", bdy: { body: fbTools.conv.form({ fb_dtsg: await fbTools.get.local().dtsg, privacy_source: "privacy_settings_page", uid: userId }) } }),
		unfriend: async (userId) => fbTools.fet({ url: "https://www.facebook.com/ajax/profile/removefriendconfirm.php", bdy: { body: fbTools.conv.form({ confirmed: 1, fb_dtsg: await fbTools.get.local().dtsg, uid: userId }) } }),
		unfollow: async (id) => fbTools.fet({ url: "https://www.facebook.com/ajax/follow/unfollow_profile.php", bdy: { body: fbTools.conv.form({ "nctr[_mod]": "pagelet_collections_following", fb_dtsg: await fbTools.get.local().dtsg, location: 4, profile_id: id }) } }),
		poke: async (userId) => fbTools.fet({ url: `https://www.facebook.com/pokes/dialog/${fbTools.conv.query({ poke_target: userId })}`, bdy: { body: fbTools.conv.form({ fb_dtsg: await fbTools.get.local().dtsg }) } }),
		post: {
			del: async (postId) => fbTools.fet({ url: `https://www.facebook.com/ajax/timeline/delete${fbTools.conv.query({ identifier: `S:_I${fbTools.get.local().me}:${postId}`, is_notification_preview: 0, location: 9, render_location: 10 })}`, bdy: { body: fbTools.conv.form({ fb_dtsg: fbTools.get.local().dtsg }) } }),
			offNotification: async (groupId, postId, follow) => fbTools.fet({ url: "https://www.facebook.com/ajax/litestand/follow_post", bdy: { body: fbTools.conv.form({ fb_dtsg: await fbTools.get.local().dtsg, message_id: postId, follow: follow }) } })
		}
	},
	page: {
		inviteLike: async (pageId, arrInvite, inviteMessage) => { let f = { fb_dtsg: await fbTools.get.local().dtsg, invite_note: inviteMessage, page_id: pageId, ref: "modal_page_invite_dialog_v2", send_in_messenger: false }; arrInvite.forEach((id, index, arr) => {f[`invitees[${index}]`] = id;}); return fbTools.fet({url: "https://www.facebook.com/pages/batch_invite_send/", bdy: {body: fbTools.conv.form(f)}}); },
		like: async (pageId, orNot) => fbTools.fet({ url: `https://www.facebook.com/ajax/pages/fan_status.php?av=${fbTools.get.myId()}`, bdy: { body: fbTools.conv.form({ actor_id: fbTools.get.myId(), add: orNot, fb_dtsg: fbTools.get.local().dtsg, fbpage_id: pageId, reload: false }) } })
	},
	reaction: async (postId, reactType) => fbTools.fet({ url: "https://www.facebook.com/ufi/reaction/", bdy: { body: fbTools.conv.form({ client_id: "1489983090155:3363757627", fb_dtsg: await fbTools.get.local().dtsg, ft_ent_identifier: postId, reaction_type: reactType, session_id: "84d81e4", source: 2 }) } })
}