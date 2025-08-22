[00:00:00] If you've ever watched cloud code forget
[00:00:02] that function that you've just built or
[00:00:04] lose track of your project structure
[00:00:06] midway through a session, then you know
[00:00:08] exactly what I'm talking about. It
[00:00:10] starts to forget important details
[00:00:12] because in a longunning session, Cloud
[00:00:15] Code will automatically compact the
[00:00:17] conversation and then suddenly it's
[00:00:19] suggesting changes that would break
[00:00:21] everything that you've just built. The
[00:00:22] real problem is that we're filling up
[00:00:23] the context window way faster than we
[00:00:26] should be. every verbose instruction,
[00:00:28] every unnecessary file that's read,
[00:00:31] every back and forth revision, all of
[00:00:33] that adds up and before you know it,
[00:00:34] Claude code is working with a fraction
[00:00:37] of the context or the short-term memory,
[00:00:39] if you will, that it needs in order to
[00:00:41] be effective. So, here's what I
[00:00:43] discovered. You can actually accomplish
[00:00:45] a lot more with Cloud Code by doing
[00:00:47] less. I've got a few simple adjustments
[00:00:49] that you can start making today to not
[00:00:52] only 10x or 50x the size of the context
[00:00:55] window that you're working with, but
[00:00:56] these tips will also help you streamline
[00:00:58] your entire workflow. You'll build
[00:01:00] features faster, you'll debug more
[00:01:02] efficiently, and you'll never lose
[00:01:05] momentum due to these context limits.
[00:01:07] This is how we start to think about
[00:01:09] context engineering. It's about making
[00:01:11] this a win-win. more productive sessions
[00:01:14] and a smoother development experience
[00:01:16] when you're building with AI. So, in
[00:01:18] this video, I'll show you some of these
[00:01:20] new power moves when you're working with
[00:01:21] cloud code, including making the use of
[00:01:23] the new sub aents feature, which is a
[00:01:25] total gamecher, and I'll show you some
[00:01:27] updates that I just made to agent OS.
[00:01:30] That's the free open- source system I
[00:01:32] built for specdriven development with
[00:01:34] cloud code. It supports the new sub
[00:01:36] aents feature and I found a few ways for
[00:01:39] agent OS to help you use your context
[00:01:41] window more efficiently. As we go along
[00:01:43] here, I'll reveal a few pitfalls that I
[00:01:45] ran into in my projects and maybe you
[00:01:47] are too, which could be secretly eating
[00:01:50] up your context window unnecessarily.
[00:01:52] Once you see how simple these fixes are,
[00:01:54] you'll be speeding past other
[00:01:56] developers. Because that's what I do
[00:01:57] here on the channel and in my free
[00:01:59] weekly email, the builder briefing. I
[00:02:02] help professionals like you and me
[00:02:03] upgrade our workflows when it comes to
[00:02:05] building with AI. You can get the next
[00:02:07] issue of my builder briefing by going to
[00:02:09] buildermethods.com.
[00:02:11] And subscribers will be the first to
[00:02:12] access my Claude Code course coming this
[00:02:15] year. Now, in case you're wondering what
[00:02:16] all this talk about context windows is
[00:02:18] all about, let me give you a quick
[00:02:20] refresher. Think of Claude Code's
[00:02:22] context window as its short-term memory.
[00:02:25] every prompt you write, every file it
[00:02:27] reads, every response it generates takes
[00:02:30] up a little bit more space in that
[00:02:32] context window. Now, this is not to be
[00:02:34] confused with Claude MD files, which I
[00:02:36] tend to think of as the long-term memory
[00:02:39] for Cloud Code since it contains
[00:02:40] information that Claude can refer back
[00:02:42] to anytime. The context window, on the
[00:02:44] other hand, I think of as the short-term
[00:02:46] memory for Cloud Code since that's the
[00:02:48] memory of things that we're working on
[00:02:50] right now and in the past few minutes.
[00:02:53] The context window for cloud code is
[00:02:54] around 200,000 tokens. And that might
[00:02:57] seem like a lot, but you'd be surprised
[00:02:59] at how quickly it could add up. Reading
[00:03:01] a typical file in your codebase could
[00:03:03] eat up 500 or a,000 tokens multiplied by
[00:03:06] all the files in your codebase. And then
[00:03:08] again, if it's searching and rereading
[00:03:10] files or reading logs or fetching
[00:03:12] documentation off the web and reading
[00:03:15] all of that or analyzing an image or
[00:03:17] reading a highly detailed spec, all of
[00:03:20] that fills up the context window fast.
[00:03:23] And once that context window fills up,
[00:03:25] cloud code starts forgetting things.
[00:03:27] It's not that cloud stops working
[00:03:28] altogether. It tries to automatically
[00:03:30] compact the conversation, but in that
[00:03:32] process, it loses important details. So
[00:03:36] that function that you just wrote, it
[00:03:37] forgot about that. Or that important
[00:03:39] instruction that you gave it earlier,
[00:03:41] that's gone. Now it can find those
[00:03:43] details again, but it's like you're
[00:03:45] paying twice because the searching and
[00:03:47] rereading of the content eats up more
[00:03:49] tokens in your context window. Now I'm
[00:03:52] going to get into how to be a lot more
[00:03:53] efficient when it comes to managing your
[00:03:55] context window. But what do we do when
[00:03:57] we've already filled it up or we're
[00:03:58] coming close? You may know about the
[00:04:00] clear command, which completely resets
[00:04:02] the context. It's a clean slate. Use
[00:04:05] clear when you're done and you're ready
[00:04:07] to move on to the next task and the
[00:04:09] previous context doesn't even matter.
[00:04:11] You know, using the clear command is
[00:04:12] just like spinning up a fresh cloud code
[00:04:15] instance, whether you're in a new
[00:04:16] terminal or if you're spinning up
[00:04:18] multiple cloud codes that run at the
[00:04:20] same time. And by the way, I have
[00:04:22] another video on this channel where I
[00:04:24] show you the best workflow for
[00:04:26] multitasking with cloud code. And then
[00:04:28] you have the compact command which cloud
[00:04:30] code will actually use on its own
[00:04:32] automatically when you've filled up your
[00:04:34] context window. And what that will do is
[00:04:36] it'll summarize everything from your
[00:04:38] current context and then start a fresh
[00:04:40] context, pass along that summary so that
[00:04:42] you can somewhat continue where you left
[00:04:44] off. Now I say somewhat because you know
[00:04:47] a small summary of a 200,000 token
[00:04:50] conversation certainly will not capture
[00:04:52] every important detail that you want to
[00:04:54] carry forward. So, did you know that you
[00:04:56] can proactively run the compact command
[00:04:58] and give it specific instructions on
[00:05:00] exactly which pieces of information and
[00:05:03] bits of content that you want it to
[00:05:05] include in that summary to pass along as
[00:05:08] you extend out the context window and
[00:05:11] cloud code conveniently shows you when
[00:05:13] your context window is running low. So,
[00:05:15] that could be a good indicator for when
[00:05:17] it might be time for you to run that
[00:05:18] custom compact command and pass along
[00:05:20] your instructions to keep it going. And
[00:05:22] so instead of just typing /compact or
[00:05:25] letting cloud code run that
[00:05:26] automatically, you might try something
[00:05:28] like /compact keep the database schema
[00:05:30] and the authentication logic. And now
[00:05:32] cloud code knows exactly what to
[00:05:34] preserve when it compresses everything
[00:05:36] else. All right, now we've got to talk
[00:05:38] about the new sub aents feature in cloud
[00:05:40] code because it's a complete gamecher
[00:05:42] both when it comes to your workflow and
[00:05:44] for massively extending your context
[00:05:46] window. Sub agents let you create
[00:05:48] dedicated coding agents that are highly
[00:05:51] specialized in a particular area like
[00:05:53] running tests or creating files or
[00:05:55] committing to git. And so when you call
[00:05:57] on a sub aent or when you ask cloud code
[00:06:00] to delegate to any of your sub aents, it
[00:06:02] passes along instructions and then your
[00:06:04] sub agent performs a task in its own
[00:06:07] fresh context window. Meaning while it's
[00:06:09] performing that task, it's not eating up
[00:06:12] context in the main agents window. All
[00:06:15] right, let me show you an example of
[00:06:16] putting sub aents to work when I'm using
[00:06:19] agent OS in cloud code. So, as a simple
[00:06:21] example, I'm going to start creating a
[00:06:23] tic-tac-toe game. So, I'm going to fire
[00:06:24] up Claude and I'm going to run the agent
[00:06:27] OS plan product command. And this is
[00:06:30] going to go through our product planning
[00:06:32] process.
[00:06:34] First, it'll gather some information
[00:06:35] about the product that I want to build.
[00:06:37] And usually, I give it a lot more detail
[00:06:39] than this, but this is just a simple
[00:06:40] example. Uh, we're going to build a
[00:06:42] simple tic-tac-toe game. Just creating a
[00:06:44] simple HTML vanilla JavaScript thing
[00:06:46] here.
[00:06:49] Okay, so it just called on the first sub
[00:06:50] agent. That's the context fetcher. And
[00:06:53] what that one does is it goes into my
[00:06:55] agent OS documentation and it pulls out
[00:06:57] my important preferences when it comes
[00:06:59] to building uh products. It it then
[00:07:02] called on my file creator sub agent to
[00:07:05] create uh some files and folders inside
[00:07:07] my project. And so these are things that
[00:07:09] would normally eat up tokens in my main
[00:07:12] context, but as you can literally see
[00:07:13] here, you know, 3,500 tokens were taken
[00:07:16] by that sub agent. This one is writing
[00:07:19] several files and folders right now. Um,
[00:07:22] all using its own tokens in its own
[00:07:24] context window. Okay, so now agent OS is
[00:07:27] going on to document the mission for
[00:07:29] this new product following our process
[00:07:31] for that. Again, we're calling on the
[00:07:33] file creator sub agent. You can see the
[00:07:35] previous one used, you know, over 7,000
[00:07:37] tokens on its own. And this one is now
[00:07:40] writing a detailed mission for the
[00:07:42] product. And as it works, we are not
[00:07:44] eating up the main agents context
[00:07:47] window. And so you can literally start
[00:07:49] to see the savings in context space. You
[00:07:51] know, 8,000 tokens, 7500, 3500, and on
[00:07:55] we go. Now, we're building out the tech
[00:07:57] stack for this uh very simple game
[00:07:59] product. And all of this is being built
[00:08:02] into the product folder in my project.
[00:08:05] My other video on the channel does a
[00:08:06] full deep dive into how agent OS works
[00:08:09] and the philosophy behind it and how to
[00:08:11] use it. So you should check that out.
[00:08:12] Now, one of the nice things about how
[00:08:14] agent OS is designed is we're going to
[00:08:16] build out all these product planning
[00:08:18] documents like the mission statement and
[00:08:20] the you know the target users, the
[00:08:22] problem, the solution. Uh we build out a
[00:08:24] whole uh road map. We have our whole uh
[00:08:27] tech stack documented here. And then
[00:08:29] this is a new update to agent OS. We're
[00:08:31] now creating a mission light. So we have
[00:08:34] some of these like light versions which
[00:08:36] are easier and more context efficient to
[00:08:39] refer back to later when we're creating
[00:08:42] feature specs and then executing the
[00:08:44] tasks for those feature specs. All this
[00:08:46] stuff is useful for us humans on on the
[00:08:49] team as well as feeding it as training
[00:08:52] material to Agent OS when it's writing
[00:08:54] out specs. Okay, so we've built out all
[00:08:57] the product planning stuff for this
[00:08:58] project. The next step, of course, would
[00:09:00] be to move on to writing feature specs
[00:09:02] and then actually building out those
[00:09:03] specs. And those can even be in their
[00:09:05] own context windows. But let's just see
[00:09:08] what happened here. Every time we see
[00:09:09] one of these like highlighted things
[00:09:11] here, that means that it used a sub
[00:09:12] agent to do that task. And you can
[00:09:14] literally see the savings in uh in in
[00:09:18] context here. Again, like you know,
[00:09:20] almost 8,000 tokens, 9K tokens, 7,500.
[00:09:24] So each of these were done in their own
[00:09:26] context window. And so agent OS now
[00:09:28] actually ships with its own cloud code
[00:09:30] sub aents. As of today, we have four
[00:09:33] that are built in. And I'm adding a few
[00:09:34] more as we go along here. Um, so I'm
[00:09:36] hopping over to my home folder on my
[00:09:39] system here. We've got my core uh agent
[00:09:41] OS instructions and standards. Again, I
[00:09:44] go deep into that in the agent OS video
[00:09:46] on my channel. But in the clawed folder,
[00:09:49] we install the agents folder with these
[00:09:53] uh four sub aents. So you can take a
[00:09:56] look here. We've got the our context
[00:09:58] fetcher. And by the way, I'm following
[00:10:00] Anthropic's instructions to to say use
[00:10:03] proactively to to do whatever it is that
[00:10:06] you do. In this case, it retrieves and
[00:10:08] extracts relevant information. So it's
[00:10:10] like reading lots of files and finding
[00:10:12] bits of information. I want that to be
[00:10:14] done by a sub agent so that I'm not
[00:10:17] eating up that context in the main
[00:10:19] agents conversation. Um, file creator is
[00:10:22] for creating, you know, new files,
[00:10:24] directories, applying templates and
[00:10:26] whatnot. Uh, git workflow is for, you
[00:10:28] know, commit messages and creating pull
[00:10:30] requests. And then testr runner is for
[00:10:33] proactively running all of our tests for
[00:10:36] specific features or running the entire
[00:10:38] test suite and then suggesting fixes
[00:10:40] back to the main agent to execute on
[00:10:43] those fixes. So, you know, we've got
[00:10:45] like workflows and stuff built into
[00:10:46] these agents. Um, you can take a look at
[00:10:48] them. Agent OS is free and open source
[00:10:51] for you to uh tweak and use and build on
[00:10:53] in your own projects. And by the way, if
[00:10:55] you want to start to spin up your own
[00:10:57] agents for cloud code, it's super simple
[00:10:59] to do. All you need to do is run agent.
[00:11:01] And first it'll show you the agents that
[00:11:03] you have. Again, we installed a few from
[00:11:05] agent OS. You might not have any yet.
[00:11:07] And so you can just go here and create a
[00:11:09] new agent. Uh you can decide if it
[00:11:11] should be specific to the current
[00:11:13] project or if you want to install it
[00:11:15] into that global agents folder on your
[00:11:18] system as we did using uh agent OS. And
[00:11:21] so you would just go through there and
[00:11:22] then you know generate with cloud.
[00:11:24] They'll give you a simple process and a
[00:11:26] simple template. Let's go ahead and do
[00:11:27] that. Let's create a an an agent that's
[00:11:30] uh an expert at refactoring front-end
[00:11:34] templates. I probably want to develop
[00:11:36] something like that in the near future.
[00:11:38] Um but let's just see what it comes up
[00:11:39] with. You know, then you can actually
[00:11:41] decide which sets of tools are going to
[00:11:44] be available to the sub agent. You can
[00:11:46] uh even give it more granular control.
[00:11:48] In this case, uh this is just an
[00:11:49] example. We'll go with all tools. Oh, I
[00:11:52] actually I just unselected that. So, I'm
[00:11:54] going to select that again. Then I'm
[00:11:55] going to go up to continue. We'll decide
[00:11:58] which model it uses. Got to go with
[00:12:00] opus, right? Then you can give it give
[00:12:01] it any color that you want. Let's go
[00:12:03] with orange. All right. Then it gives us
[00:12:04] a basic template for uh the agent
[00:12:07] itself. Let's go ahead and accept that.
[00:12:09] And I'm going to hop over to my home
[00:12:11] folder, which is where uh it installed
[00:12:13] it on my system. And we're going to go
[00:12:15] into claude under agents. And there is
[00:12:18] the front-end uh template refactor agent
[00:12:21] that it created. So, you know, Cloud
[00:12:23] Code itself actually generated all of
[00:12:26] this, you know, example content just
[00:12:28] just on the very short description that
[00:12:29] I gave it. Now, you know, you'll
[00:12:31] probably want to go in here and really
[00:12:32] tweak it to your exact preferences for
[00:12:35] what you want this type of agent to do.
[00:12:37] Um, but that's a look at the process for
[00:12:39] spinning up your own agents. Here's the
[00:12:42] counterintuitive part. We're used to
[00:12:43] training our human team members with
[00:12:46] detailed documentation and context. But
[00:12:49] when it comes to training AI agents,
[00:12:51] being verbose can actually hurt
[00:12:53] performance. Every extra word in your
[00:12:55] instructions not only adds to your
[00:12:57] context window, but also introduces the
[00:12:59] opportunity for Cloud Code to get
[00:13:01] confused or go down the wrong path. So,
[00:13:03] it's better to be concise and direct and
[00:13:06] then instruct Cloud Code to ask
[00:13:08] clarifying questions when it needs to.
[00:13:10] Think of it like this. You want Claude
[00:13:12] code to act like a senior developer who
[00:13:14] knows when to ask clarifying questions
[00:13:16] when it needs to, not a junior developer
[00:13:18] who needs every little detail spelled
[00:13:20] out. This is why spec driven development
[00:13:22] works so well. When you develop clear
[00:13:25] specs upfront and then you spend the
[00:13:27] time to review that execution plan
[00:13:29] before you build, you don't need to give
[00:13:32] Claude code verbose instructions when
[00:13:34] you get up to that building phase. the
[00:13:36] agent can just work from and pull from
[00:13:38] those well-crafted specs without needing
[00:13:40] to give it extra explanations. Now, in
[00:13:43] my last video on this channel, I did a
[00:13:44] deep dive into that specdriven
[00:13:46] development approach. So, you won't want
[00:13:48] to miss that. And this week, I released
[00:13:49] an update to Agent OS where I cut almost
[00:13:52] half of the instruction lines, making
[00:13:53] them simpler and more direct. The
[00:13:55] result, Agent OS is helping me build
[00:13:57] even more ambitious projects with cloud
[00:14:00] code because it's that much more
[00:14:01] efficient at managing the context
[00:14:03] window. Now, my last tip when it comes
[00:14:05] to working efficiently is I don't
[00:14:07] actually use cloud code for everything.
[00:14:09] I like to use cloud code as my workhorse
[00:14:11] for building entire features, typically
[00:14:13] from a spec. But I found that what
[00:14:15] really starts to eat up the context
[00:14:16] window in cloud code are those back and
[00:14:18] forth rounds of revisions. You know,
[00:14:20] move this function over here or refactor
[00:14:23] that code or go fetch some documentation
[00:14:25] from the web and fix some code based on
[00:14:27] what you learned. All that stuff adds up
[00:14:29] and then when it comes time to build the
[00:14:31] next feature with claude code, you're
[00:14:33] out of space in the context window.
[00:14:35] That's why I'm currently using Claude
[00:14:36] Code running inside of Cursor. I find
[00:14:38] Cursor's interface to be better designed
[00:14:40] for that rapidfire collaborative
[00:14:43] tweaking and refining. I can make quick
[00:14:45] adjustments in Cursor's AI chat without
[00:14:47] worrying about polluting or busting my
[00:14:50] well-managed context window in Cloud
[00:14:53] Code. You know, this isn't about one
[00:14:54] versus the other. This is about two
[00:14:56] specialized tools working really well
[00:14:59] handinand. Cloud code for creation,
[00:15:02] cursor for collaboration and refinement.
[00:15:05] So hopefully you can see how just a few
[00:15:07] simple adjustments can give you a
[00:15:09] massive efficiency boost when you're
[00:15:11] working with cloud code. Now for a
[00:15:12] deeper dive into what cloud code is
[00:15:14] really all about and the movement that
[00:15:16] it's creating in our industry, I want
[00:15:18] you to see my other video where I make
[00:15:20] the case for cloud code. So, right after
[00:15:22] you hit subscribe on this channel, you
[00:15:24] can check out that video next and I'll
[00:15:25] see you there. Let's keep building.
