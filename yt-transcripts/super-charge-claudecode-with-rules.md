[00:00:00] So, here's where I'm at lately. I feel
[00:00:03] like right now, if you're a solo dev,
[00:00:06] especially if you're living in Swift UI,
[00:00:09] Xcode 26, claude, cursor, all that, it's
[00:00:14] kind of wild out here, right? Every week
[00:00:17] there's some new agent, some uh AI
[00:00:20] workflow, or some tool promising to
[00:00:23] change the way we build apps. It's
[00:00:26] exciting, but honestly, it can get messy
[00:00:28] really fast. You find yourself bouncing
[00:00:31] between so many different ways of
[00:00:34] working, and if you're not careful, your
[00:00:37] project turns into this giant pile of
[00:00:40] half-baked experiments. And, you know,
[00:00:43] I've definitely been there. Uh, for a
[00:00:45] while, I just treated AI tools like,
[00:00:49] well, a fancy vending machine. I'd drop
[00:00:52] in a prompt, cross my fingers, and hope
[00:00:55] whatever came out wouldn't wreck my code
[00:00:57] base. But yeah, you do that long enough,
[00:01:00] and eventually something's got to give.
[00:01:03] You end up cleaning up after the agent
[00:01:06] as much as you do shipping actual
[00:01:08] features. Let me just fire up Claude
[00:01:10] Code right now and do a slash in it on
[00:01:13] this project so you can see what happens
[00:01:15] when it scans my actual docs and
[00:01:18] rules.md file. We'll come back to what
[00:01:21] Claude gets. So, yeah, the thing that
[00:01:25] really changed it for me, honestly, it
[00:01:28] wasn't a fancy plugin. It wasn't some
[00:01:30] new Claude mode. It was just starting to
[00:01:33] document my workflow, like really
[00:01:36] document it right alongside my code. I
[00:01:38] started making this little uh rules.md
[00:01:42] file for every project. Not because I
[00:01:44] wanted more homework, not because I
[00:01:47] needed another checklist, but because I
[00:01:49] was sick of reexplaining my own thinking
[00:01:52] to the agent, to myself, to future me,
[00:01:55] who's probably just as forgetful as I am
[00:01:58] now. And when you do that, when you
[00:02:00] actually treat your rules.m MD like
[00:02:03] you're onboarding a teammate. Yeah, even
[00:02:06] if your only teammate is an AI,
[00:02:08] everything gets easier. Suddenly, it
[00:02:11] feels like you've got someone in your
[00:02:13] corner. You're not just building alone.
[00:02:16] So, that's what I want to get into
[00:02:17] today. I'll show you how I set up my
[00:02:19] rules.m MD, how it actually fits into my
[00:02:22] Xcode and Claude/cursor workflow, and
[00:02:26] yeah, why I honestly think it's one of
[00:02:29] the most underrated habits for any Solo
[00:02:33] Swift dev who's tired of feeling like
[00:02:35] they're starting from scratch every
[00:02:37] single session. But just real quick, I'm
[00:02:40] Daniel. I've been in the iOS game for
[00:02:42] almost eight years, freelancing and
[00:02:45] shipping apps for other people. But
[00:02:47] since Dubdub 25, I've gone full solo dev
[00:02:51] mode, started building in public, and
[00:02:54] yeah, kind of figuring out this personal
[00:02:56] brand thing as I go. More on that for
[00:02:58] another time. All right, let's just be
[00:03:01] real for a second. I did not start out
[00:03:04] with this super organized rules.mmd
[00:03:08] habit. I mean, like every solo dev I
[00:03:11] know, I was just building an Xcode,
[00:03:14] scribbling little toados in the code,
[00:03:17] maybe dropping a reminder for future me
[00:03:20] in some notion doc or worse, my phone,
[00:03:23] and then like clockwork, I'd I'd fire up
[00:03:28] Claude or Cursor and just sort of hope
[00:03:30] it would, I don't know, pick up on my
[00:03:32] vibe and not completely miss the point.
[00:03:34] And yeah, sometimes if you're just
[00:03:37] cranking out a tiny feature or uh need a
[00:03:41] quick bit of code gen, that's actually
[00:03:42] fine. But the minute your app gets
[00:03:45] bigger, like you've got logic shared
[00:03:47] between the app and a widget or you want
[00:03:50] the agent to follow your exact
[00:03:53] architecture instead of riffing off into
[00:03:55] some wild MVVM experiment, you hit this
[00:03:59] wall. The AI has no clue what you
[00:04:02] actually want unless you really spell it
[00:04:04] out. That's why rules.md became a thing
[00:04:07] for me. It's not just for the agent,
[00:04:10] honestly. It's the dock I wish I could
[00:04:13] shove at my past self or, you know, any
[00:04:16] random teammate, whether they're real or
[00:04:18] just made of code. Every weird
[00:04:20] constraint, every little no. Don't do it
[00:04:23] that way. Every time apples he gives me
[00:04:26] a headache, every time I break up a big
[00:04:28] view, it all lives here. So now whether
[00:04:32] I'm doing slashinit with claude or
[00:04:36] booting up cursor or just jumping back
[00:04:38] into my own code after a break, all my
[00:04:41] context is waiting for me. It's like
[00:04:43] this little contract between me, my
[00:04:46] future self, and whatever AI I'm working
[00:04:48] with. And yeah, it makes everything just
[00:04:50] a bit less chaotic. And honestly, here's
[00:04:54] where things got kind of cozy for me.
[00:04:56] And honestly, this is the part that
[00:04:58] makes me weirdly happy. Every time I
[00:05:01] open Xcode, I just stop tossing these
[00:05:03] files all over the place. No more buried
[00:05:06] markdown docs in Dropbox. No half-finish
[00:05:08] lists floating in Notion. Now, whenever
[00:05:11] I kick off a new app, I just set up a
[00:05:13] proper documentation folder right inside
[00:05:16] Xcode using doc. everything uh my
[00:05:21] article, my PRD, my rules.md
[00:05:24] lives right there with my code. You
[00:05:26] know, it sounds simple, but having all
[00:05:28] my docs and Xcode just feels
[00:05:32] right. Like I'm already spending most of
[00:05:34] my day in that window anyway, tweaking
[00:05:36] Swift UI layouts, refactoring a stubborn
[00:05:40] view, poking at core data. Why bounce
[00:05:43] between five tools just to remember what
[00:05:46] I was thinking? And since I still like
[00:05:48] to hand build the first pass at any new
[00:05:50] feature, keeping my rules front and
[00:05:52] center just fits, it feels native, like
[00:05:55] Xcode is actually home base, not just
[00:05:58] where I go to type code. And what's even
[00:06:00] better now when I bring Claude or Cursor
[00:06:03] into the mix, there's zero confusion.
[00:06:05] The agent's not off hallucinating from
[00:06:08] some outofdate doc. It's reading the
[00:06:10] same stuff I am right from the source.
[00:06:13] No old copies lurking in a cloud folder.
[00:06:17] No weird merge conflicts with myself. If
[00:06:20] you're the kind of person who gets a
[00:06:22] little burst of joy from a clean project
[00:06:25] tree, trust me, this just hits
[00:06:27] different. So yeah, this is where it
[00:06:30] actually gets interesting. What goes
[00:06:32] into my rules.mmd? It's not just a
[00:06:35] checklist of do this, don't do that.
[00:06:38] Honestly, for me, it's like writing a
[00:06:41] little manifesto for every project,
[00:06:44] especially with uh something like this
[00:06:47] custom clock widget app. I want the
[00:06:50] agent to feel like it's joining the team
[00:06:52] and not just spitballing code in the
[00:06:54] dark. You know, I lay out the whole
[00:06:58] engineering ethos right at the top. I'll
[00:07:00] literally say, "Look, you're a senior
[00:07:02] iOS engineer. We're building an SLC app
[00:07:06] here. Keep it simple, lovable, complete.
[00:07:09] Don't get clever with architecture.
[00:07:12] Stick to MVC. Use core data and delight
[00:07:15] users, but always stay minimal. Follow
[00:07:18] Apple's hig like it's gospel. If you're
[00:07:22] going to riff, um, riff within those
[00:07:24] lines. And then, uh, I get super
[00:07:27] explicit about patterns. Shared code
[00:07:29] between app and widget. It's not
[00:07:32] optional. It's a rule documented. every
[00:07:35] Swift UI view. Static previews always.
[00:07:38] Views get split if they get chunky. Like
[00:07:41] a 100 lines is the soft ceiling. Files
[00:07:44] shouldn't balloon past 200. No third
[00:07:46] party packages. I don't want the AI
[00:07:48] going wild and sneaking in random
[00:07:51] dependencies. Just stick to what ships
[00:07:53] with Swift UI, Widget Kit, and core
[00:07:56] data. And yeah, the don'ts are just as
[00:07:58] important. Don't add random
[00:08:00] customization. If it's not time zone,
[00:08:03] hand style, or label, forget it. No
[00:08:05] iCloud, no advanced settings, no weird
[00:08:09] hidden gestures. Widget code got to be
[00:08:12] shared with the app or it doesn't ship.
[00:08:14] Even how I handle money, one-time
[00:08:16] unlock, no subscriptions, no trials, no
[00:08:20] surprises. But the big thing, and this
[00:08:23] is what I always hope future me
[00:08:25] remembers, is the why. The app is SLC.
[00:08:30] So if you ever get stuck, always lean
[00:08:32] towards what's more delightful and
[00:08:34] simple. And if in doubt, just go check
[00:08:37] article.md.
[00:08:39] It's all in there. So yeah, it's not
[00:08:41] just for the AI. It's like a living
[00:08:44] project brain dump, but structured so
[00:08:47] any agent or even future Daniel can
[00:08:49] immediately get the full vibe and all
[00:08:51] the constraints. And honestly, if you
[00:08:54] ever find yourself forgetting why you
[00:08:56] made some weird architecture choice,
[00:08:59] this is the safety net you didn't know
[00:09:00] you needed. So, okay, here's where
[00:09:04] things actually start to feel like
[00:09:06] magic. Um, or, you know, at least less
[00:09:09] like wrangling a stubborn robot.
[00:09:11] Whenever I'm ready to hand off a new
[00:09:14] feature or even just a gnarly refactor
[00:09:16] to Claude or Cursor, I don't just toss
[00:09:19] out a random prompt and cross my
[00:09:21] fingers. I point the agent straight at
[00:09:23] my rules.m MD and all the other docs in
[00:09:26] my documentation doc folder. It's like
[00:09:29] giving the AI a real onboarding packet,
[00:09:32] not just asking it to guess what
[00:09:34] matters. with clawed code. It's
[00:09:36] literally slash in it. Let it scan my
[00:09:39] files and suddenly the model actually
[00:09:41] gets the big picture. It's not just
[00:09:43] winging it. It knows the project
[00:09:45] structure. It gets the don'ts. It gets
[00:09:47] why the previews matter. It understands
[00:09:50] my weird no third party rule. Cursor,
[00:09:53] same deal. I'm not just hoping it
[00:09:55] follows my style. I see it actually pick
[00:09:57] up my preferences and run with them. For
[00:10:00] once, it feels like it's working with
[00:10:02] me, not just generating code in a
[00:10:05] vacuum. And the thing I love, uh, when
[00:10:08] the agent drifts, like maybe it tries to
[00:10:11] sneak in some wild new architecture or
[00:10:14] skips out on previews, I just update the
[00:10:18] rules.m MD or even ask Claude to update
[00:10:21] cla.md for me right there in the
[00:10:23] session. The feedback loop gets tighter
[00:10:26] every time. It's wild. The AI actually
[00:10:29] learns. So, if you're still treating
[00:10:31] these tools like slot machines, just
[00:10:34] hoping for the best, seriously, start
[00:10:36] briefing them like a real teammate.
[00:10:38] Reference your rules.mmd every time.
[00:10:41] You'll spend way less energy arguing
[00:10:44] with the bot and honestly way more time
[00:10:47] actually shipping features. And yeah,
[00:10:50] that's kind of the dream, right? And
[00:10:53] yeah, let's not pretend this is
[00:10:55] glamorous. Most days updating rules.mmd
[00:10:59] is just part of the grind. Usually it
[00:11:01] happens after something breaks. Like
[00:11:04] I'll realize I forgot to make uh widget
[00:11:07] kit use the same clock rendering as the
[00:11:09] app or maybe I skip previews because I'm
[00:11:12] in a rush and then pay for it later. But
[00:11:15] honestly, every time I add another
[00:11:17] little reminder or fix to rules.md my
[00:11:21] next session with claude or cursor just
[00:11:23] goes smoother. It's almost like, okay,
[00:11:26] future me, you won't have to clean up
[00:11:29] this mess again. And, you know, it's
[00:11:30] kind of become a ritual. I ship a
[00:11:33] feature. I just sit for a minute,
[00:11:35] reflect. Uh, what was weird? What would
[00:11:38] have saved me a headache? What do I want
[00:11:40] the agent or future me to remember next
[00:11:44] time? Straight into rules. MD it goes.
[00:11:47] If something big changes, like I add a
[00:11:50] new pro unlock or do a big core data
[00:11:53] refactor, I give myself a little mini
[00:11:55] retro and update the docs. And low key,
[00:11:59] it's making me a better dev. I spend so
[00:12:01] much less time reexplaining my own weird
[00:12:05] patterns or backtracking on accidental
[00:12:07] changes and way more time actually
[00:12:09] building. even if I step away for a
[00:12:12] couple weeks or switch between projects,
[00:12:15] all my stuff that matters is right there
[00:12:16] waiting. So, yeah, it's not always
[00:12:19] glamorous, but it's real. Uh, and it
[00:12:22] actually works. So, here's the real
[00:12:25] bottom line for me. If you're a solo
[00:12:27] indie dev, you're not just writing code.
[00:12:31] You're actually managing yourself every
[00:12:33] single day. There's nobody else to keep
[00:12:36] you in check or remind you what weird
[00:12:39] decision you made last Tuesday at
[00:12:41] midnight. It's way too easy to drown in
[00:12:45] context switching or just forget some
[00:12:47] tiny but critical constraint you swore
[00:12:50] you'd remember. Honestly, having a
[00:12:53] rules.md is like throwing your future
[00:12:56] self a lifeline. It's the doc you'll
[00:12:59] actually read later and it's the the one
[00:13:01] your AI agent will actually follow if
[00:13:04] you point it in the right direction. And
[00:13:06] man, it just makes switching between
[00:13:08] tools or even between whole projects so
[00:13:11] much less painful. You're not stuck
[00:13:14] relearning your own quirks every time
[00:13:16] you come back to a repo. You don't have
[00:13:19] to make it perfect either. Uh, mine's
[00:13:21] always a mess full of little, oh, by the
[00:13:25] way, notes, random fixes, and stuff I
[00:13:29] thought was obvious, but yeah, wasn't.
[00:13:32] But honestly, uh, it saved me so many.
[00:13:35] Why did I do this? Especially when I'm
[00:13:38] moving fast or trying to debug something
[00:13:40] weird months later. And as these AI
[00:13:43] tools get better, more agentic, more
[00:13:47] tightly woven into Xcode, I think the
[00:13:50] indie devs who get used to writing down
[00:13:52] their intent, constraints, and habits up
[00:13:55] front are just going to get way more out
[00:13:58] of this whole agent work. So yeah, it's
[00:14:01] not just about the bots, it's about
[00:14:03] making solo dev a little less lonely and
[00:14:06] a lot more manageable. So yeah, that's
[00:14:10] my real take on why I bother with a
[00:14:12] rules.mmd. And honestly, it's not just
[00:14:15] about making Claude or Cursor happy.
[00:14:18] It's about making life way easier for
[00:14:20] myself, too. You know, it's become this
[00:14:23] little ritual that keeps my workflow
[00:14:26] actually human, less lonely, more, I
[00:14:29] don't know, playful. There's something
[00:14:31] kind of fun about coming back to a
[00:14:33] project after a month and seeing all
[00:14:35] those, "Hey, don't forget this lines
[00:14:37] from past me or realizing that, yeah, I
[00:14:41] saved myself from tripping over the same
[00:14:43] bug twice." And honestly, if you've got
[00:14:46] your own little hacks, weird rituals, or
[00:14:50] even just a story about how a single
[00:14:52] line in your rules.md saved your butt,
[00:14:54] let's hear it. Throw it in the comments,
[00:14:58] DM me, whatever. I love swapping notes
[00:15:01] with other solo devs who are figuring
[00:15:03] this all out. Or if you're just now
[00:15:05] starting your first rules.mmd, give it a
[00:15:08] shot on your next project. Doesn't have
[00:15:10] to be perfect. Um, even one don't do
[00:15:13] this line will pay off. I promise.
[00:15:16] Future you and your AI agent will
[00:15:19] absolutely thank you. If you found any
[00:15:22] of this helpful or you're trying to
[00:15:24] carve out your own indie dev workflow
[00:15:26] with Swift UI, claude, cursor, all the
[00:15:29] usual suspects, feel free to like,
[00:15:32] subscribe, or send this to a friend
[00:15:34] who's in the trenches, too. I read every
[00:15:36] comment really. And honestly, swapping
[00:15:40] workflow tips is the best part of this
[00:15:43] whole thing. So, yeah. Until next time,
[00:15:46] keep crafting, keep refining, and just
[00:15:49] remember, you're not building alone.
[00:15:51] Even on those days, it totally feels
[00:15:53] like you are. Peace.
