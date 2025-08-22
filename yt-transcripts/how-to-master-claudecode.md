[00:00:00] If you're using cloud code by just typing in prompts as though it's another GhatGPT, you're missing 90% of its value.
[00:00:07] Cloud code comes off deceptively as just another lightweight command line tool, but really under the hood, it's much more than that.
[00:00:15] It's the first in the coming wave of highly powered AI agents. Understanding how to harness that power is critical, and I think what might be
[00:00:23] holding you back from being fully blown away by Claude Code's capabilities. My name is Patrick, a CTO, and co-founder of an AI native startup who's been
[00:00:31] using Claude Codes since February. Earlier this week I spoke to a group of founders in Seattle.
[00:00:37] Alongside my friends Anad and Galen about the core principles to employ and
[00:00:42] the tactical frameworks and tools to get the most outta CLA code, we will cover a range of what we feel are the most valuable topics, including using
[00:00:51] CPS to give eyes to Claude Code using the double escape method and resume method in order to fork Claude code context and spin up multiple instances.
[00:01:00] One of my favorites and extremely helpful automated code review, a quick state of the union of the top code gen tools, including Codex and others.
[00:01:09] The My Developer Prompting Trick that Galen demos towards the end of the talk. That was actually one of my biggest takeaways, how we structure validation
[00:01:16] steps to ensure Claude knows what is good and what is bad output and many others in the description.
[00:01:22] I've greatly detailed each section. And the topics that we spoke through. So if you're already familiar with a topic, I'd highly recommend just
[00:01:28] skipping through to what's interesting and relevant as there's a lot of good gems in there in my unbiased opinion.
[00:01:34] And I've also linked the slides from all three of our talks so you can reference that. I hope this helps you unlock the next level outta cloud code.
[00:01:41] And with that, here's the nod to kick us off. This is the main question that I get asked, uh, quite a lot.
[00:01:46] What's the difference between Claude code and cursor? I think it sums up to this CLO code is really good at multi-step processing.
[00:01:53] So you have a large task you want to get done. It can break it down into subtasks, execute them one by one.
[00:01:59] I use it for starting projects constantly. I post new project like every, every other couple of days just because I'm
[00:02:06] able to create a really, really good spec, really good planning document, which I'll get into later, give it to cloud code.
[00:02:12] And I just let Claude code run, uh, freely, uh, which is probably not great to do, but you know, there's no stakes to like these random side projects
[00:02:18] and it's really good at doing that. And it's again, because of that reflective loop. Um, if there's a lot of complexity, this is what I mentioned just a minute
[00:02:26] before, where you have to pull in a lot of things from different files. It's good at doing that as well.
[00:02:32] And if you have a very long running process, I tend to prefer quad code. Cursor is still really good though at specific, solving specific
[00:02:40] problems, addressing very specific files or lines of code, because you can select those things very easily.
[00:02:45] Let's go into the Cloud MD file. So this file is your main context file. So when you run slash knit.
[00:02:51] And we'll get into what that means in a, in a sec. It will generate an overview of your code base. It'll go through all your files, figure out how everything is set
[00:02:59] up, make detailed notes about, you know, the startup processes, where everything is located.
[00:03:04] And, uh, I like the quote from the documentation, which is that your Cloud MD files become a part of cloud's prompts.
[00:03:10] I mean, that's what literally happens. Um, so they should be refined, like any frequently used prompt.
[00:03:16] So effectively, if they think of it like a read me for specifically built for Claude code. The init function is great, but I have my own set of commands that I run where
[00:03:25] I ask it to go through every file, and first of all, extract the file structure and the folder structure. Then for each of those folders, I have a new Cloud MD file.
[00:03:33] So in each subfolder I have a Cloud MD file, and effectively you can create detailed notes for every single detailed readme's, you
[00:03:41] know, for every single sub folder. To the point where you can track every single function and file.
[00:03:47] And then when Claude needs to do an operation, it's no longer, you know, grepping like crazy. You can have it just a look at those Claude MD files.
[00:03:53] As long as they're updated, it will drastically reduce, you know, how much cognitive load, it's over, it's on, it's taking on.
[00:04:00] Yeah. So the file is more like, or is it more like, uh, the
[00:04:05] cursor, you know, rules file? Like how do I prompt? It's kind of a mix. It's more like the pro, it's like a, you know, cursor rules are effectively
[00:04:12] prompts that go into cursor, right? So it's. But it's also a read me of your entire code base. So it can act as both. But here's a good example of what I have in my cloud, actual cloud files, right?
[00:04:19] So I have, this is like the, the main, you know, uh, I have a backend and a front end.
[00:04:25] So I say, okay, here's how it's set up. I have my front end has this kind of set up, my backend has this kind of set up, um, and I have it covered, the front end structure, which actually
[00:04:34] then also has a much more detailed list in the front end folder itself.
[00:04:39] Then I have my backend structure, which is in the backend folder, uh, but you know, in more detail. But I can extract, extract those up into my, you know, project
[00:04:49] folder or company folder. So it's easy for me to also see, but also easy for, like, if I have to run
[00:04:54] thing, cross code, uh, code base or cross repo, it's a lot easier to manage them.
[00:04:59] And some other MD files that are not as, uh, talked about, I feel, but are very
[00:05:05] useful are things like the change log. If you have a good change log, it's easy for Claude to over time realize what
[00:05:13] were the changes that were made and why. So every time you make a change, just ask it to update the change log separately from the Claude MD file.
[00:05:19] And that just gives you a, gives it a good understanding of, okay, here's why I changed it and here's why we shouldn't go back to doing this.
[00:05:25] I use a Plan MD file for every new project that I start, or every new task that I start. It's effectively the list of things that I actually want to
[00:05:31] get done in a single document. Alright. Now here's the one major thing that I wanna touch upon that
[00:05:37] I think is really interesting. You can attach Claude code into your GitHub repo.
[00:05:42] This basically replaces, well, effectively it is Devon, but using your op, your philanthropic key, it's super easy to set up.
[00:05:50] You just run this command, they automate everything for you. It's really, there is no hassle.
[00:05:55] Um, and then you can go in and create an issue like I had some.
[00:06:01] Project I wanted to do, I was all right, create this component for the library, and I tag Claude, like I would tag some developer and it goes in, it creates
[00:06:10] the issue, it creates this to-do list, this checklist executes that, and later
[00:06:16] when I actually am like, you know, hey, this was like not that great, I can just tag it again in the same, in the PR like I would with an actual developer,
[00:06:25] and it'll go through and do that again. I can do way more things using this process.
[00:06:30] Then I can adjust on my own, uh, computer running one agent or even multiple agents at the same time.
[00:06:37] It's extremely convenient. Um, it also has, cloud code has built in commands like review PR comments
[00:06:43] that allow you to effectively automate the review process from your console, you know, fetching the comments so that you can then, it can then
[00:06:50] operate in your local environment. These commands are built. I, I would really recommend exploring them and.
[00:06:56] I could just run 30 different commands at the same time. I used Claude Coat to say, here's a list of all the features I wanna build.
[00:07:03] Generate PRS for every single one of these, and make sure you tag Claude at Claude at the end of it so that it will, you know, spin off the job.
[00:07:12] And it was able to do that. This isn't my phone. Like by the time I got home, it was all complete. It was just amazing.
[00:07:18] With the integration with GitHub or just Yes. On the cli? No, from the CLI. You can integrate it into GitHub. Yeah. So it's effectively an app that running.
[00:07:25] What's running there, but it is the Quad Code bot, and now we'll get to commands. This is a, this is what a command is.
[00:07:30] Command is just a prompt. It's just a prompt that you can save in a file, share amongst
[00:07:36] projects, share amongst your team. You can develop these like very comprehensive step-by-step things
[00:07:42] and, and you can actually run it just like you would the pr, the install GitHub that were built in from cloud.
[00:07:47] You can, you can write your own. And why this is great is because you might have specific things you want your team to know.
[00:07:53] Or if somebody on your team is just a clawed expert or a or a AI prompt expert, they write something amazing.
[00:07:58] You can now share that with the entire team. It's super easy to use. You should really look into using commands which allow you to create these
[00:08:05] comprehensive workflows just using a prompt that Claude can then easily follow.
[00:08:11] This is, for example, the code base analyze prompt that I can use to set up my really, really comprehensive.
[00:08:17] Uh, analysis in a Cloud MD file, and you can see like it's super long, but it works. I even made a GitHub action that can then be run, you know, right in, right, right
[00:08:27] from your GitHub, uh, uh, interface. And these are, this is just all the commands that I, that I've collected.
[00:08:33] Anyway, here's the, uh, website and QR code. If you're interested. I've just made it really easy to add this disclaimer is that I made this,
[00:08:39] um, but I really do believe it's a really good way to share those ideas. You can also launch subagents.
[00:08:45] If you're just starting off with cloud code, don't even think about this, but just like you can basically run two things at the same time. It's pretty cool. So the analyzer command was command, you were talking about
[00:08:51] to generate the Code MD files. That's one I use to make a more comprehensive Cloud MD file.
[00:08:57] It can just be to analyze the code base in general. Hey everybody, my name is Patrick. I have been using cloud code since it came out back in February 24th,
[00:09:05] uh, which feels like forever ago, but it's been amazing to see just the constant evolution of new features.
[00:09:11] One of the coolest things I feel like with Claude Code is how the Anthropic team very obviously works closely together on the ML and AI side.
[00:09:20] So the actual machine learning researchers that are doing the post-training and the fine tuning and everything, uh, along with the actual product team.
[00:09:27] So you see this close coupling with Claude Code that I think really sets it apart from any other experience.
[00:09:33] I was just listening to the Klein founders on the Latent Space podcast. Excellent recommendation, by the way, that podcast episode
[00:09:39] and just the podcast overall. And they were talking about how Opus four and Sonnet four just so badly
[00:09:46] want to use bash commands, uh, to gr around as, as an nod was speaking to.
[00:09:51] So there was a, there's a whole realm of, uh, preferred. Bits of what Opus four and Sonnet four try to do that fit really, really
[00:09:59] well with cloud code, given that the application and machine learning teams are, are speaking closely together.
[00:10:05] So that's one reason why Cloud code is is fantastic to use. But I'll speak a little bit to the.
[00:10:12] The fundamentals of cloud code. So what makes this more exciting and interesting and like thus all the hype
[00:10:19] recently over a cursor or other platform? From my perspective, the biggest pieces here are we're, we're actually, we're
[00:10:27] doing much more than just code gen. We're really, we're working with one of the first in production, um, like age
[00:10:34] agentic tools that can do multi-step. Processing on the order of roughly an hour or so.
[00:10:39] You can think a lot broader than just code gen in terms of applications for this, which I'll get to a few of my favorite non-coding workflows in a second here.
[00:10:48] But I think just feeling the character, the nature, uh, what helps these agents run for longer and to get more accurate towards what we're
[00:10:55] actually trying to execute with them. All of these factors are really, really helpful lessons for us to be learning
[00:11:01] and internalizing now as we're building age agentic workflows in other domains in our own products, or using tools such as Gemini to summarize YouTube videos or
[00:11:10] whatever other workflows we might have. So that's one amazing part of Cloud Code Cloud is also fine tuned for, as
[00:11:16] I mentioned, tools that cloud code. Takes great advantage of. So you've got, uh, the bash type commands.
[00:11:23] So being able to gr your code base and use the GH or GitHub CLI tool. But we also have the native tooling, so web search, uh, file search.
[00:11:33] One of the, my favorite bits is this to-do list. Back in the day, I'd always create these PRDs, which is still a helpful workflow,
[00:11:40] but for most things, I can just defer to cloud code doing the, uh, shift tab, tab to get it into planning mode.
[00:11:46] Think through. And iterate on the, the spec of what we're trying to accomplish and then allow it to create a little to-do list to kind of keep it on track,
[00:11:53] especially when it's handing off between different steps and using subagents to summarize different parts of the code base or think through and do research.
[00:12:02] Being able to pull that back and keep grounded in the to-do list even it's a little like six bullet to-do list, is super, super helpful.
[00:12:10] A few other tools such as its ability to reflect on what it's outputting is a absolute game changer.
[00:12:16] I see this happen quite a bit, where it'll work through something and be like, wait a second. This actually isn't the best approach to this, or this assumption was mistaken.
[00:12:23] And that ability, as you can imagine when you're trying to let it run on a task and come back in 15 minutes or whatever to verify the output is super helpful.
[00:12:31] It's just one less touch point and usually multiple less touch points that you're having to go in and and babysit the model for, in addition to the output just being
[00:12:38] much better with that reflection piece. So there's a number of reasons why that pairing of Opus four specifically, but sonnet four as well.
[00:12:45] With cloud code is a really incredible and productive workflow.
[00:12:50] One note too, uh, when you're using cloud code, if you run forward slash model, you can choose Sonnet versus Opus.
[00:12:57] So just in case you're not aware of that, the default is sonnet. Opus is four times more expensive, but if you're on the max plan, it's
[00:13:03] uh, which is a hundred or $200 a month plan, which I'd highly recommend. The amount of inference we get is ridiculous. I mean, I would, I would estimate if I'm fully using Claude in a
[00:13:11] month, it's, you know, in order of three to 5K in terms of like API costs, but it's $200 a month slot.
[00:13:17] So I don't know how long this is gonna be a long, uh, round or if they're gonna try to water it down like cursor or others. So I wanted to mention the different types of agents that just give a quick overview.
[00:13:25] We've got, of course, chat based agents, which we're all familiar with, chat, GBT, Gemini, et cetera. We also have these CLI and IDE based agents, cloud code of course, being
[00:13:34] an example, cursor windsurf, uh, the brand new chiro or, uh, kiro from uh, AWS or Amazon Kline, et cetera.
[00:13:42] And then we have background agents, which are just starting to kind of roll out over the last couple months. So Codex, which also has a CLI tool, but of course they've got, uh, with open AI's,
[00:13:51] uh, ProPlan, at least you can kick off. Ag agentic processes that will run anywhere from one to four
[00:13:56] different instances of O three. And then I would also loop the GitHub integration, which I won't belabor since an no talked about it, but it's incredible.
[00:14:05] One of our friends, Sam, just walked me through this. Absolutely mind blowing workflow that he's got. He basically took the integration that you can build with cloud code, with GitHub,
[00:14:14] and then he, uh, modified the yamo file. 'cause basically what it's doing is to just create a YAML file, that's a GitHub
[00:14:19] action configuration file, and then you can add additional details so you can modify the prompt that it's running.
[00:14:25] You can might, I would highly recommend uncommon. The, uh, the model it uses so that you can use opus instead of sonnet.
[00:14:31] The default, which is, it's, it's in there as a default. You just have to accommodate. With this, you can add additional parameters, for example, basically
[00:14:38] sneaking CPS into your config file, and also give it permission to use different bash tooling and then give it access to other configuration
[00:14:46] files like markdown files. So all this to. Just through that GitHub integration, there's a lot you can really squeeze out
[00:14:52] of it to essentially create, as Anad was saying, a Devon type experience, but with much more control and with better models.
[00:14:58] What's also so cool about this is, as Anad was saying, you can embed any process that you have internally around, uh, like amazing ways to go about code review.
[00:15:07] And, uh, also based on the user that's submitting the pr, you can, uh, you, you could change things up as well, so you could really get these parts
[00:15:16] of your workflow embodied within. These commands or these, uh, these runners.
[00:15:21] And that's one thing I love about cloud code and also CPS is being able to encapsulate these different workflows that we have internally, which even just
[00:15:28] as one dev, it's helpful, but across the team, incredibly helpful to embody that, uh, that knowledge and that, uh, ability to be super productive and
[00:15:37] hand that off to less junior folks. They don't have to understand all the underlying details. So we have background agents.
[00:15:44] Again, GitHub integration being what I would consider part of that. And then kind of it's connected, but separately, uh, a little bit
[00:15:50] more advanced is, or agent swarms. These are really cool. It's basically spinning off a bunch of containers.
[00:15:56] Oh. Um, codex is essentially this, where you can go from one to four if you have four of 'em right. At the same time. You've got all these agents running and then they're, um, coming up with
[00:16:04] a solution, and then you can compare. Either manually or through, uh, LLM as judge.
[00:16:10] My friend Sam was walking me through this workflow as I was mentioning, where he is got three opus instances that kick off and then they've got
[00:16:16] acceptance criteria that they can look at for what good code looks like. Different style guides, examples of of of, uh, like API documentation
[00:16:25] and um, API spec standards and it'll compare outputs against that. And an LLM will choose which version of those, you know, three outputs.
[00:16:33] It likes the best, and then we'll automatically merge it in, you know, build a ci CD pipe pipeline, and then he can review it at that point.
[00:16:39] So you can get pretty sophisticated with the swarm idea. That's a more basic version. And then at the AI Engineer World's Fair that a few of us went to down
[00:16:45] in SF about a month ago, uh, we saw examples of, I mean, hundreds of these containers, you know, being kicked off.
[00:16:50] Now, of course, that's, uh, would, would bankrupt me with, uh, Opus four. But it, it's, it's exciting to think about.
[00:16:56] And then of course non-engineering agents as well, such as, uh, Manus and Deep Research and others we're familiar with my favorite Claude code and the CLI.
[00:17:06] And also in headless mode, they've got an SCK for TypeScript Python. And then of course just, uh, uh, in the CLI as well, you've got this little
[00:17:13] intelligence that you can, you know, pipe things into in your terminal. You can put it in your build pipeline, you can have it review and build
[00:17:21] all kinds of different stuff that's. Like right where you're at or within your application.
[00:17:26] And I think kind of thinking about Claude Code, not as just a code gen tool, but as this agent that you can deploy in a bunch of different contexts is really powerful.
[00:17:35] I also love g uh, Gemini, CLI, very similar to Claude. Code doesn't have the magic, but for other tasks, one of, one of
[00:17:41] the coolest ones I found was. Somebody using Gemini to basically watch, uh, a YouTube video, which
[00:17:48] they can see one frame a second. And they have of course, of the transcript as well through Google's, uh, first party integration with their YouTube, uh, tool.
[00:17:54] I do this all the time, even before I watch like a hour talk. I'll just summarize it.google.com and we will basically get a
[00:18:01] sense of what it's talking about. Or if I were like, for this talk, there was one detail I remembered from a a, a Claude talk, but I didn't wanna go through the entire hour to try to find it.
[00:18:08] I just quickly asked like, Hey, I remember this point, like roughly speaking, where is the time code for this? And it pulled it up.
[00:18:13] Super helpful and, and this is just one workflow with YouTube, but super helpful. Another cool one though is with the Gemini CLI, you can take a tutorial and
[00:18:21] then have it try to execute and build that locally on your computer if it's something that would be doable from like a, a command line or using, you know,
[00:18:28] different tool that you're exposed to it. So very versatile. Okay, so what agents need for great con uh, performance context.
[00:18:35] Context is everything. Context truly is everything. As you guys probably know, prompt engineering just got
[00:18:40] rebranded to context Engineering. Given that what we fit into the model, what we give them.
[00:18:46] The analogy I, I pulled from, I believe it was the Anthropic CPO, uh, who's also the Instagram founder.
[00:18:51] But the way he was talking about it is, imagine you're a Claude code. You wake up, you're in this box, and all you have is what some person
[00:18:58] just handed you, IE the prompt. It's gonna be extremely hard to, to do anything productive with that if you've
[00:19:04] got limited context, limited tooling. So giving the context of the code base architectural style,
[00:19:10] what our preferred libraries are. Different like UI mocks and style guides. I mean, anything that can help it understand like examples of, of
[00:19:17] good output and bad output, what it needs to do along with evals or ways to evaluate the output.
[00:19:23] So again, examples of good and bad linters are, are super helpful. I mean, I, I just have it run elint every time it's doing anything 'cause
[00:19:30] that, uh, just save me a ton of time. You just wanna keep that agent loop going as, as long as you can and give it as much, uh, feedback in real time as possible, any standards.
[00:19:38] So, uh. Like, you know, around commits and branching mean, for example, acceptance criteria, automated tests, and then also tools.
[00:19:45] So different cps, uh, are the easiest way to expose these, but also the built in web search and bash, uh, GitHub, CLI, there's a lot of other tools you can give these
[00:19:55] models to perform and, uh, do much better. There's a lot beyond engineering too, that these agents are great at Second
[00:20:01] Brain, uh, which is basically like a methodology around personal knowledge management and like note taking, which can be really helpful along with
[00:20:09] different computer administrative tasks. So like naming, screenshot, space off content, what's in there, organizing files automatically.
[00:20:15] Of course, you know, pipe operator. There's a uh, MCP for blender, which is really fun to create 3D models.
[00:20:20] I haven't used it myself, but I've seen some amazing demos getting close to time. So I'll just really quickly go through the rest of the slides here.
[00:20:26] Different types of cps that can be really helpful. These are the main categories of, uh, functioning, the type of MCP.
[00:20:32] These are, uh, some of the best registries of CPS where you can find them. There's like behaviors with React that are terrible for users that
[00:20:39] end up happening when you kind of just throw a lot of code together.
[00:20:45] Yeah. Um, and fixing it is hard and I figured there's some way to do it If you have some MCP that's gonna load it and then kind of output, you know, the progress
[00:20:55] is some format that could be read by by an lm, but I don't know what that is yet. You know, I don't have a good solution to this.
[00:21:00] One thought though, is maybe having to input break points to get it to kind of pause at different UIs. States and then take a screenshot is maybe one interesting
[00:21:08] approach just to throw out there. But, uh, great question. Alright, I, I'm, I'm outta time. Uh, unfortunately, uh, I'll share these slides though.
[00:21:16] There's, there's a lot of stuff in here that I'm really passionate about, but I wanna make sure we have, we have time here. So, big picture, I can't believe we didn't cover this yet.
[00:21:24] This is what you want to do every time you are using Claude Code on the command line. How many of you actually use Claude Code?
[00:21:29] Have used it. You've all used it. Okay. So you know this. So hopefully I'll give you something a little more interesting,
[00:21:36] but explore, plan, execute. If you jump straight to execute, I do this sometimes I'm like, this is gonna be so easy.
[00:21:42] Claude is dumb and it will screw it up. Um, I actually find that sonnet four with thinking hard is better than Opus
[00:21:50] for a lot of tasks and it's faster. Um, so, but you know, your tax comp task complexity may be different than mine.
[00:21:58] So my goal is to make. Here is to make Claudes spend tokens to build up context.
[00:22:04] You can read the markdown file. I don't, mine's never up to date. Or it reads it and it starts, you know, imagine you read 300 lines and someone's,
[00:22:11] and about like how someone's code base works, and they're like, now build this. You're gonna mess something up.
[00:22:17] So prepare to work on this. Claude starts with an idea of what it's gonna work on. And it's like, okay, it's just like you, like all of you.
[00:22:25] You're like, okay, you start reading and then you're like, okay, I know how to build this. And you stop reading and you're like, I'm ready to build.
[00:22:31] If you're like, read the code, it will read a little bit more. But if you're like prepared to discuss how our front end works,
[00:22:38] Claude will spend 50,000 tokens over seven minutes just being like, okay.
[00:22:43] And then it'll give you a nice overview of how it works. And when you do that, Claude is much smarter.
[00:22:48] And if it, if the overview's wrong, escape. Escape or slash clear, start over.
[00:22:55] Don't try to correct. You can try to correct it. I do it sometimes, sometimes at work. But you're just basically chewing through tokens in your context window.
[00:23:02] Trying to push back on somebody who, on a bad contractor, just fire the contractor, get a new one if it is wrong, what else do you put in there
[00:23:09] to make it right the second time? Just like rerun it and see if, just rerun it. It's gonna reuse a bunch of subagents. It's gonna get it right, it's gonna be right nine outta 10 times.
[00:23:17] This is a great. This is a great gambling game and you just, when you lose, you're
[00:23:23] not like, oh, why did I lose? You're like, no, I win almost all the time. I make just markdown files.
[00:23:28] I have Claude write them. So like, talk about how our architecture works for, you know,
[00:23:33] and then make a checklist of like, this is what we're working on. This is like an old one. Obviously don't write any code.
[00:23:39] Uh, this is like maybe if you have a pr consider the next one review read relevant, but I actually think this is a lot better.
[00:23:44] We're gonna work on the document identification part of the app, dig in, read relevant files, prepare to discuss the ins and outs of how it works.
[00:23:49] Sometimes I'll follow up with questions to just to make sure it actually has the context. Um, and often I will double escape to remove that from the context
[00:23:57] if I think it's doing a good job. Just because I burn, like I don't want to, I like a lot of room in the context window.
[00:24:03] So double escape. How many of you use double escape with club? Okay, you should use all, you should use this all the time.
[00:24:09] So I just spent seven minutes building up context. This person's this, this contractor's really good at this.
[00:24:16] I can double escape and just fork the conversation, like I can have it do a bunch of work, double escape and go back to this same point where they have all
[00:24:24] this context saves me money and time, like mostly like I won't get kicked out of my max plans as soon as quickly.
[00:24:32] Mostly just like I don't have to sit there and wait and maybe get the, get a bad gamble. If you get a smart cloud, you should keep it and reuse it over and over and over.
[00:24:40] Um, so this is the what it looks like. You double escape and you can just go back to any previous conversation.
[00:24:45] This is a crazy branching multiverse. So you can open up a new tab. You just built up a bunch of context, open up a new tab, hit resume, and you get all
[00:24:53] that context in the new tab in terminal. So you can do like five terminals all with all of that exact amazing
[00:24:58] front end or backend or API context. You can, you can ask a couple of questions and start there.
[00:25:05] Whatever you, wherever you want. Just don't do this and then start like having it write three different things on the front end.
[00:25:10] Go. Do you prefer like get work trees or just different directories, or how do you go about I prefer to not work on more than two tasks at a
[00:25:18] time because my brain gets fried. I end up with 15 tabs open.
[00:25:24] I go back to a tab, I'm like, wait, what's that tab? And I'm like, oh my God, I cannot make this decision right now. This is like, why did I even start down this path?
[00:25:30] I just have like two work trees, which is just like your entire Git library, like in a parallel case.
[00:25:36] And I will just like, merge them into master. I just keep them open. They're just sitting there. 'cause I don't care.
[00:25:41] Uh, I don't use GI appropriately. Um, um, so plan, I don't use plan mode.
[00:25:47] The, the three, five or four times I've tried it, like didn't do as good a plan as me asking it to do a plan.
[00:25:53] I like to think hardest. This is where you really have to think, Claude needs to think hard to plan. Um, so this is my like generic instructions.
[00:26:02] I really like this. Write the function names in one to three sentences about what they do. Write the test names five to 10 words, like about the behavior they cover.
[00:26:09] But really the short overview if like, 'cause Claude's default for plan is often like, here's a bunch of code that I'm gonna write and you're like.
[00:26:18] Now I want you to think higher level than that. I want you to tell me conceptually what you're doing. 'cause when you start doing code like that, you're starting to
[00:26:26] get into the weeds and you're not thinking architecturally. So this is like a, this is a different example.
[00:26:31] I have, like, I actually have built up this whole system for adding new PDF types. So I have like a, like a whole system where I like basically take
[00:26:39] a PDF and I throw out a Gemini. But I have different types and I have different verifications I wanna run on them. I just have it read a couple of guides.
[00:26:46] And then I just let this run so there's no context on this. I can just put this into GitHub and then I go to Claude and
[00:26:51] I'm like, do GH issue one 40. Close it when you're done.
[00:26:57] And then I just hit like, auto accept, goodbye risk-based planning. If it's small, don't overthink, just rate the code medium to large.
[00:27:04] You've gotta break it into like testable, deployable prs. Um, and that's, I think of this in terms of context windows, you know,
[00:27:10] and that's like about a PR size for me. It's about a PR sized chunk of work. Um, and then high risk, I'd take, I think you should take three shots
[00:27:18] at the plan, two or three shots. Um, you should really work over it. Like with Claude, I'm not making the plan again.
[00:27:24] Like I'm just looking at its plan and I'm like, this smells bad. Like this is a terrible, like if an engineer came to me, you are an engineer.
[00:27:30] You're coming to me with this. Like, I'm like, this is really com complicated. It's gonna be like, you're gonna screw it up.
[00:27:37] It's gonna mess up the code base. So. Once I've done the plan, I open up a new tab, pull up that same amazing
[00:27:44] context, but don't dive into the plan. Don't, don't, don't get like once, once it's made the plan,
[00:27:49] it's not gonna critique itself. But if you go back to the amazing context and you're like, yo, my developer came up with this plan to do this, Kala's like, yeah, all right.
[00:28:00] Let me tell you about this plan. I am with you. I'm on your team, not on your developer's team.
[00:28:05] If you're like, I came up with this plan, it'll like tell you a lot of nice stuff. It'll be like, great job. You did a great plan.
[00:28:10] Here are a couple little things you might do differently. But this case, it's gonna be like, yeah, your developer,
[00:28:16] you know, like, I don't know. I wouldn't have done it that way. Um, and try to get specific.
[00:28:21] If you're just like, they made this plan, it's like, it's not gonna do a good job, but, so ask the questions you would ask yourself.
[00:28:27] Um. So get feedback on the plan. You can make, have two clouds, make the plan.
[00:28:32] Um, you can have a third cloud decide between them. Um, I tend to put them into markdown and have cloud work on them, and
[00:28:40] then I have it break them up into PR sized chunks and then we execute. And those pr size chunks, you might as well use that same context that you've
[00:28:48] already built up because it's so valuable to have those 50,000 tokens about your database, or sorry, your, your app in the.
[00:28:57] In the context window, it's gonna write much better code than if you just like bring up a blank claw with 200 lines of the Claw md. So pull up that 50,000
[00:29:06] token context window, say work on PR one. This is my example.
[00:29:11] Prompt think hard rate, elegant code that completes this. This is a real big one. It loves backwards compatibility, which I don't, I'm like, no, I, and it like, it's
[00:29:21] like on, we'll have graceful fallbacks, and I'm like, no, that's just junk. That will break.
[00:29:26] And then it will gracefully fall back. When you say that, that means to me that the app is going to silently fail
[00:29:32] and I will not know about it because it will just start leaning on some old code that you should be deleting.
[00:29:39] Um, this is, you can tell where I get frustrated with Claude. Um, so I try to, this is a little overkill, like the testing and
[00:29:46] sometimes, but I think linting compiling and, and writing corresponding tests is good for really simple stuff.
[00:29:52] I actually just say like, do TD. And it writes the test, it writes the failing test. It writes the code that makes the test pass and it does a great job.
[00:30:00] It's really good. TDD is terrible. When I did code, I remember trying it for like a week and being like, fucking hate TDD.
[00:30:06] This is just like, this is worse than writing tests. Um, so I like thinking hard or think for this, um, I write have Claude write lots
[00:30:15] of scripts to check its own work, so like. I gave it a script to call Gemini with PDFs or I had to write that
[00:30:21] script and now I'm like, test to make sure that like when you verify, like you created a new markdown file that verifies PDFs, make sure it actually
[00:30:29] works and it verifies with this one. Or if you need to view a PDF file cloud's terrible at that.
[00:30:34] It can't do it. Ask Gemini or ask un instruct. It will give you a markdown file. Go, you know, look at that.
[00:30:40] Then you can read it and understand what's going on and you can like figure out what, what to do. This is a big question to watch or not to watch.
[00:30:46] Do you like. Because Claude will make, in my case, like one out of 10 to 20 times it's gonna start copying code and just doing some dumb stuff.
[00:30:56] And I'm not gonna look at the commit. I'm gonna watch it as it goes pretty much, or I'm not gonna watch it at all. I'm gonna be like, committed.
[00:31:02] It works. It's good. Um, so I've seen 200 lines of copied code go through.
[00:31:07] I have a weird config that's in five different places in my app, and I'm just like, every time I'm like, God, could we just.
[00:31:13] Can we just put this config into one place and it's like, oh yeah, here's a plan. And I'm like, all right, you're stupid like this.
[00:31:19] Okay, this is harder than it looks, I guess. Um, return True was a 3.7 problem. You will not get that anymore.
[00:31:26] Um, but usually if you just hit, go, like you kind of get a feel for it. I have a feel for it now where I'm like, this is an easy enough
[00:31:32] thing for Claude just to do. Go shift tab, you know, puts it on to auto complete.
[00:31:38] Um. I don't know if you all have heard how this came to be, like why we have
[00:31:44] amazing coding agents now, but it's because of RL and it's because once the
[00:31:50] models, once you're, once you move up the tech tree enough where models can write good compilable code, you can actually then start to have, give them
[00:31:57] coding problems and then, and figure out if, like, basically they have to be able to create the solution like 80% of the time or tasks, like the way
[00:32:05] that they did thinking was they were just like, write a bunch of stuff. And at the end, if you get the right answer, you get a cookie and
[00:32:13] we're gonna reward that circuit. And if you don't, you don't get a cookie. Right. And if it like, so we got to like GPT-4 and Claude three, five level models.
[00:32:22] And you could start actually like turning, thinking on, but because the models were good enough to get all the way through, but uh, the problem is like you're
[00:32:31] creating software engineering problems and you're just like, and they're verifiable. So like, write this code.
[00:32:36] Does it compile? Does it answer the right question at the end? Very easy to test back. Right?
[00:32:42] But does, does that make for good edits? No, that makes for really good writing. Fresh new codes, new methods.
[00:32:50] Claude prefers that, I dunno if you've all noticed that, but you're like, in my case, you're probably, if you're editing stuff like cursor style, it doesn't matter.
[00:32:58] But in my case I'm like, write this. Edit the code, figure out where you can edit because you
[00:33:03] really have to prompt that. 'cause Claude is still really tuned into like, okay, I'm gonna write some new code.
[00:33:09] This is gonna be fun. We're gonna do a new method, guys. Uh, so, uh, sorry it got cut off here, but yeah, cloud three seven was
[00:33:16] like over rld on just like completing tasks and they dialed that back. That's where the return true came from.
[00:33:22] But we still have this problem where Claude is like just trying to finish, like it's trying to finish tasks and get its cookie.
[00:33:29] By writing new code, not by editing or elegantly integrating code.
[00:33:35] Uh, so then I go back to the developer thing, right? I lean on the developer. Uh, so I go back to that, the planner.
[00:33:41] So I have my planner tab open and I'm just like, yo, my developer just finished. Step two, give them low level like feedback and high level feedback.
[00:33:50] If you don't say that, it's like they did a great job. Um, so, and then I get feedback and then I go back to the developer and
[00:33:56] I'm like, Hey, I got this feedback. What do you think? And it's like, well, that's good feedback. Yeah, I'll do it. Um, and this is the problem with like, Claude, I don't know if you've hit
[00:34:05] the slash review on Claude's own code. It's like, this code's great review, doesn't, Claude likes Claude's code.
[00:34:11] Um, I use this sometimes, but uh, prepare. So I'm like, at the end as I'm running outta my context window or we're finishing
[00:34:18] up the poll request, like pay, like I say to Claude, like, tell some, give the next.
[00:34:25] You're not working on the next step of this. Give advice to the next developer. Put it in the markdown file. And cloud is usually like, you've, you're off to an excellent start
[00:34:32] here, but uh, it can be helpful. Uh, contact window management.
[00:34:39] I'm sure. Do you all get this? I like, I never compact anymore. Compact is a waste of time.
[00:34:45] It generates like a page and a half and it tells Claude to read four files and you're like, you, you end up with a very like, kind of off, off kilter dom, Claude.
[00:34:54] Uh, so I just try to rewind. I try once I get to 5%, I'm like. Document what you've done and we're rewinding back to 40% and we're gonna
[00:35:02] like, and I'm gonna be like, here's what, here's what I've done so far. Continue. Sorry. So you, you rewind instead of wiping what means?
[00:35:10] Yeah. I hate compact, I hate And Yeah, starting with clear. Yeah. I mean you could use clear, but then you don't have any context.
[00:35:16] And so I like, and you can use Rezum to get that context back or double escape. So like why not use, I mean it is more expensive 'cause you're, you
[00:35:26] already have all that like you're. I don't know that you're actually getting charged for. You only get new tokens, right? So you're not getting charged.
[00:35:31] It's much more expensive for them, but for us it's just new tokens, so it's great.
[00:35:36] Um, so you jumped straight to execution. Go ahead. One more. Oh yeah, yeah.
[00:35:42] Um, other tips and tricks. I get me, that's the problem with work trees is I'm like, all right,
[00:35:48] we're gonna do this over here. We're gonna do this over here, and like we're merge 'em. And I'm like, oh, Jesus. Now we have a merge conflict.
[00:35:54] I'm just like. Claude, there's deal with get, and it's like, okay. And it gets it right every time.
[00:35:59] I'm like, oh, this is should I like trust it. And I'm like, eh, I don't know. Every time it works, uh, I skip the ceremony for simple
[00:36:07] tasks, just like do it. Um, Claude loves to be enterprise ready.
[00:36:13] Just you have to fight that 'cause like it's, you know, built by an enterprise for enterprises. So, um, so this is one of my, like, if, if it gave me a plan that's too bulky.
[00:36:22] I love, I love this and it's just like. Totally right, and it cuts it in half and it makes it a much better plan for me.
[00:36:29] Um, explore, plan, execute, resume, my developer.
[00:36:34] Um, and then Claude made up this joke at the end for me. I didn't add this, but I like it.
[00:36:43] That's a good one. Uh, all right, so that's my talk.
[00:36:49] I hope you found our talks helpful, and if you did, I'm sure you would enjoy one of these two videos on how to become AI native as a software
[00:36:56] engineer and a founder, specifically within code gen tools like Claude Code. And with that, don't forget to subscribe for more content like this.
[00:37:04] Thank you.
