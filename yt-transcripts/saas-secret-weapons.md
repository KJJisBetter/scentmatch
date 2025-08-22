[00:00:00] Claude Code agents released recently and they are mindblowingly great. But sadly,
[00:00:05] a lot of the examples of these things that I've seen out there are two thumbs down. I'm talking about basic little
[00:00:11] prompts like you're a senior backend engineer. So, build me a backend, I
[00:00:17] guess. Well, today we will end that together like a fellowship because we're
[00:00:22] going to go through eight custom clawed code agents that I built for you that can replace an entire end toend SAS
[00:00:30] creation workflow. The goal of this to replace an entire technical team. So, we're going to go through everything
[00:00:36] from product manager to DevOps engineer to security analyst and everything in
[00:00:42] between. These agents basically take my old vibe coding framework and turn it
[00:00:47] into a reasoning machine. So stick around because I am going to show you in this video how to replicate an entire
[00:00:55] end-to-end AI development team that will work for you 24 hours a day, 7 days a
[00:01:01] week. It doesn't ask for time off and it does not complain usually. This might just be the most unfair advantage that a
[00:01:09] solo founder could ever have. So with all that out of the way, let's get into it. So first a quick recap. What
[00:01:15] actually are Claude Code agents? They're basically specialized sub aents that run inside of Claude Code and have access to
[00:01:23] their own custom system prompts, context windows, and specific tools that they
[00:01:28] can use. Now, the impact of these things is that you can code very technical things without having to be a technical
[00:01:36] genius. Now, if you've seen my old prompting system, you know it had these very long system of prompts that we
[00:01:41] would chain together, taking the output of each and pumping it into the next. Discovering these agents has been such a
[00:01:47] gamecher because now I can provide those system prompts of how I want it to reason and it can handle all of the
[00:01:53] details knowing what it needs and what it doesn't need by itself. Now, these agents should be executed in a specific
[00:02:00] order, which we can get to later on in the video. But either way, these are a serious unfair advantage that if you use
[00:02:08] them, you will have over other people that do not use them, plain and simple. So, we're going to start with the basics
[00:02:14] and show you how to set up your first one and configure it. And then we will get into all eight of them and how they
[00:02:20] work with specific examples. So, the first thing that you want to do is obviously open up Cloud Code in your
[00:02:25] terminal. Now there are two ways that you can do this. The first is that we can actually use a kind of guided
[00:02:31] onboarding process. So if you type in slash agents and hit enter, you will have the option to create a new agent
[00:02:38] with their CLI. And so if we were to click for example create new agent, we can pick if we want this to live on our
[00:02:45] computer overall or if it's project specific. So for this example, we'll do project specific. And then we can either
[00:02:52] manually configure it or we can use the claude code helper. So in this example, I will use the claw code helper to show
[00:02:59] you how it works. So we hit enter. The first thing you need to do is describe when to use this agent. Now I'm going to
[00:03:05] give a basic example here, but you do want to be comprehensive with your description. So let's say we want an
[00:03:11] agent that we use anytime we're debugging a problem. We can hit enter, and then this will actually create the
[00:03:16] agent for us and ask us which tools we want it to use. Now I'm going to show you a manual implementation. Now after
[00:03:23] this process runs through, you're going to notice a directory got created called.claude/agents.
[00:03:28] Now inside of this directory are going to be all of the agents that you have access to in this project. So this is an
[00:03:35] example of what this debugger agent might actually look like. So at the top we have a name for it. We have a
[00:03:41] description of when the system should know to use it, right? Any anytime it's analyzing and fixing bugs in code. And
[00:03:47] then we're going to give it a color that it can use. And we're going to specify the model that it should use. In this case, we're going to use sonnet. Now, as
[00:03:54] we go and look through this file, we can see the instructions, right? The system
[00:03:59] prompt that we are giving to claude code anytime it executes this agent. And we can see what this looks like, right?
[00:04:05] What's the core philosophy of the agent? Which approach does it take? What are the input expectations it should expect?
[00:04:11] What types of things should it be debugging? How should it consider debugging them? What's the overall process? and so on. You can even specify
[00:04:19] specific tools that you want this agent to have access to. For example, maybe you have a specific MCP server that you
[00:04:25] use when you're debugging. You can use that here. So now before we get into the really cool stuff, let's just look at a
[00:04:31] very basic example of this. So let's say that we have this Python file that is just meant to calculate an average. And
[00:04:38] we're going to intentionally give it a bug just to show how this works. So if we were to go in here and actually run this script, we can see that it's
[00:04:44] supposed to have an average of 20, but it actually has an average of 30. So what we would do in this case is go into
[00:04:50] claude and I could say something like use our debugging agent to debug the Python file. Very basic example. But now
[00:04:58] what we can see is it actually instantiated that specific agent that we had created earlier, this debugger. And
[00:05:05] so it's going to go through and it's going to follow this entire process that we have in order to fix this very basic
[00:05:12] bug. So let's look at what this output looks like. And so now after this thing has run, we can see that it is
[00:05:17] implementing a fix in our file. And if we run the script, we can see that it's now fixed. Average is 30. Average should
[00:05:23] be 30. Now obviously that was a very basic example. So let's get into some more detailed examples. So we're going
[00:05:29] to go through all eight of these agents that I have for you. And yes, they will be made available in the description
[00:05:35] below the video. The one caveat that I will say is these are not necessarily the order that I would use them in. That
[00:05:42] video where we build a full end toend SAS application that is ready for production is going to be coming later
[00:05:48] in the week. We're going to be putting these all into a six to sevenphase system. So the first agent that we're
[00:05:54] going to look at is our product manager. The reason we're doing that is if we're starting a project from scratch, we need
[00:06:01] to translate our abstract idea about this app into very concrete particulars
[00:06:06] of what needs to be inside the MVP. And in a SAS company, this is what a product
[00:06:12] manager would do. They're almost like mini product CEOs where they need to take an idea and a problem and the
[00:06:18] resourcing that they have within their team and they need to solve that problem and deliver the product. So, this agent
[00:06:24] is kind of like a defense mechanism in some ways. It's going to allow you to overcome your own biases about what you
[00:06:31] think should be in that MVP and instead it's going to look at the actual problems that the app is attempting to
[00:06:36] solve and how the specific features are going to solve those problems. So, we're going to put in our general idea for the
[00:06:43] app and we're going to get a lot of details out the other side. Let's go look at it. So, the first thing we have
[00:06:49] our configuration of the agent. So, we're telling it what it is, what its
[00:06:54] persona is, and how it approaches solving problems. We're talking about the executive summary that we want it to
[00:07:01] create for each feature that we're going to be building for this MVP. What is the exact formatting that we want for this?
[00:07:08] So, the feature, the user story, the acceptance criteria, meaning what needs to be true so that we consider this
[00:07:14] thing done, and a bunch of other functional and nonfunctional requirements. So for this example, we
[00:07:20] are going to be building a project that was a request of me. So in this case, we're going to specifically tell it to
[00:07:26] use this agent, which it can intelligently pick agents, but for this case, we're going to tell it which agent to use. So we're going to say, use the
[00:07:33] product manager agent based on the following app idea. The app is a Chrome extension that helps users shop for
[00:07:38] products that match their season color type. For context, seasonal color analysis is a subniche within fashion
[00:07:45] that specifies certain colors of clothing actually look mathematically better on people based on things like
[00:07:51] their skin tone, their hair color, their eye color, etc. Then I give two resources that break down the math of
[00:07:58] that specific thing. And now we can see this product manager agent that we created is going and it's starting to
[00:08:06] use specific tools that we have access to. We will come back in a second once it is done and look at the output. All
[00:08:12] right, so that just ran. It ran for about 2 minutes actually, which was a little bit long, but let's see what we got out of it. So, like we asked it to,
[00:08:19] we first got out our elevator pitch of what this app is. We get out our problem statement. Now, you would want to go
[00:08:26] through this output and make sure it's dialed in for what your app is actually supposed to be because every other stage
[00:08:33] will build on this. So, what is the actual problem statement? Most people struggle to identify this because they
[00:08:38] don't even know about it, which leads to poor purchasing decisions. You waste money on clothes that don't actually
[00:08:43] look good on you, and you just generally maybe don't even feel good about putting
[00:08:48] on clothes, like putting on nice things. So, then we get into what are some of the primary personas of this target
[00:08:54] audience? What are the demographic breakdowns? What is the unique selling point of this thing? For this
[00:08:59] specifically, there is nothing like this actually out there. There are a lot of people that do the analysis but not any
[00:09:05] that enable shopping through that specifically. So like we asked the system to do, we start going through user personas and pain points. And then
[00:09:11] we get down to the actual core user flow. So this is critical because this is what we're then going to actually start building from. And so we break
[00:09:19] down, for example, the first flow. What does it look like to actually download and install this extension and go
[00:09:24] through the first onboarding phase? What does it then look like when you're actually actively shopping with it? like
[00:09:30] what is that interaction going to look like in the browser? And then we even have some secondary or even tertiary
[00:09:36] user flows like creating wish lists, coordinating different colors. We get into feature stories, the acceptance
[00:09:42] criteria of those things, important considerations that we might want to have like progress indicators and a
[00:09:49] bunch of other really great stuff that I'm not going to go into because we'll go into this in that video next Thursday. So now the next agent we're
[00:09:54] going to look at is our UX UI designer which is actually one of my most favorite agents of the ones that I have
[00:10:01] built. Now why do I say that? There's a reason that great apps feel great and it's because someone very talented spent
[00:10:08] a lot of time thinking about how a user should actually engage with this thing
[00:10:14] in order to solve their problems. And so this agent helps us make sure of two things. number one, that the app looks
[00:10:20] great, but number two, that it actually accomplishes what it's setting out to accomplish by the way it is designed and
[00:10:26] how the user will interact with it. Because let's face it, the best way to lose confidence of an end user is to
[00:10:33] have a crappy, janky experience that doesn't make them feel very good. So,
[00:10:39] let's not do that. So again, this agent allows us to infuse the experience and
[00:10:44] expertise of a senior product designer and create that final polish for our
[00:10:50] app. So what happens with this agent is that it takes that output. It takes this product manager output that we just
[00:10:56] looked at and it processes it. And so what it's doing is it's thinking through who we're selling to and what this app
[00:11:03] is meant to accomplish. And then it builds that into a cohesive design philosophy. And so it starts with these
[00:11:10] overarching principles like the design philosophy for the UI, core UX principles that like every feature needs
[00:11:17] to conform to, but then we get in and it actually builds us out a comprehensive design system. And so these are going to
[00:11:24] be things like color theory, our typography setup, how the spacing and the layout of the system is going to be,
[00:11:30] specific components and the visual specification of those components, how they interact with those components, how
[00:11:37] these components should be used in production, because again in a more established SAS company, you're going to
[00:11:43] have a product designer or UX expert that builds the system that a front-end engineer then goes and implements. And
[00:11:49] so this is what we are trying to mimic at this stage. And so this last piece of this prompt is that we say you need to
[00:11:56] go feature by feature through this product manager output that I'm about to give you and build out the entire system
[00:12:03] of how this needs to look and how it needs to work. And there's a lot of really awesome stuff inside of this. And
[00:12:10] so this one's going to be simple. Execute the UX design agent based on the output found in our project
[00:12:15] documentation directory. Now guys, one of the things that's really awesome about how this is an agentbased system
[00:12:22] is that it will go through and as it creates things, if it realizes that it now needs to go back and update its
[00:12:28] to-do list, it's going to do that, which is a huge improvement over like a more static promptbased system. All right,
[00:12:36] guys. So now once this is done, we have a comprehensive UI UX design system and we can look at what this kind of looks
[00:12:42] like. So we have our overall design philosophy, our entire color system,
[00:12:48] spacing and layout, right? Everything we were talking about earlier. And then as we start to get further and further
[00:12:53] down, we start to see actual user journey mapping. And then we get screen
[00:12:59] by screen specifications. So for example, in the onboarding screen, what is the visual layout? What is the actual
[00:13:05] hierarchy of content that a user is going to see? What type of animations, if any, are going to be in place? Same
[00:13:12] thing for the color season assessment. What is the layout? How is everything going to flow? Now, all of this is
[00:13:20] eventually going to be passed to our front-end engineering agent. Now, while
[00:13:25] this was running, I also ran our DevOps engineer in the background. And so, what
[00:13:31] this does is in this first scope when we're in like the earlier phase of local
[00:13:37] development, it basically went through and configured our entire project. So we
[00:13:42] have all of our our lint files set up, our Babel config, our Docker files, everything basically that we would need
[00:13:48] in order to start actually running this thing, right? It even went through and created our manifest file, which is
[00:13:54] something specific that is needed for a Chrome extension. And we can see what that looks like here. So pretty robust.
[00:14:01] Now, before I ran that DevOps agent, I ran this last planning agent, which is
[00:14:07] our architecture agent. So now what this agent does is it goes through everything
[00:14:12] we've made so far. So all of the outputs from our product manager, all of the outputs from our UX UI agent, it takes
[00:14:20] all of that stuff, it's understanding of the app and what it needs to do and it builds out a detailed system
[00:14:26] architecture. So what does that mean? We're getting a comprehensive analysis basically of all of the system
[00:14:32] requirements. So for example, how can we break down the core functionality? What tech stack are we going to need to power
[00:14:39] that? What does the data architecture need to look like? How does the API need to be designed so that we can interact
[00:14:45] with this thing? What are the main security and performance considerations? What are some risks? What does the
[00:14:50] detail of the tech stack need to actually look like? What are our front-end frameworks, our backend
[00:14:56] frameworks? How are we managing context and state? All of those sorts of things. How are the components going to work
[00:15:02] within the system? what do the the database and like the data models need to actually look like? We go through all
[00:15:08] of this stuff and we can look at what that output looks like here. So, just to zoom in on like a piece of this as an
[00:15:14] example, what are some of the key architectural decisions that we need for this Chrome extension thing? Well, we're
[00:15:20] going to need the Chrome extension manifest, which we looked at a moment ago. We need to make sure it's highly performant because this is actually all
[00:15:27] going to run in the user's browser. We're going to use Google's web worker for the image processing. We're going to
[00:15:32] use an eventdriven architecture and we even get some documentation specifying, hey, this is for the backend
[00:15:39] engineering agent. They're going to need to know that these are our core endpoints and what the data types need
[00:15:45] to look like. So, super detailed overarching system documentation. So,
[00:15:51] why do we run through this system architecture agent? Just because you're a solo founder and maybe you're not a
[00:15:57] super super highly trained CTO or head of engineering or whatever it might be, that doesn't mean we can't work toward a
[00:16:03] world where we're able to create technical solutions despite not being the most technical person in the world.
[00:16:10] Because one of the biggest bottlenecks of a solo founder or a vibe coder that's just trying to build something cool for
[00:16:16] themselves, like a tinkerer, is that you have this really ambitious project, but you don't have the technical knowledge.
[00:16:21] And what I mean by that is there's a lot of tools and patterns and systems that you may just not be aware of that would
[00:16:28] help you achieve what you're trying to achieve a lot more easily and sustainably because choosing the wrong
[00:16:34] database or backend framework or anything like that can be soul crushing later on when you realize that now you
[00:16:42] need to do it. So think of this agent kind of like a CTO. It makes critical
[00:16:47] foundational decisions. So we give the agent our product plan and it gives us back a full detailed technical
[00:16:54] specification so we know what the system needs to look like to make that thing happen. What's the tech stack? What's
[00:16:59] the database schema? What's the API contracts? All of that stuff. If we scale to 100,000 users overnight
[00:17:05] accidentally because it blows up on Product Hunt, what do we do in that situation? How do we handle that load?
[00:17:11] We want this thing to think about all of those considerations. So, next up on our list is the senior front-end engineering
[00:17:18] agent. Now, the reason we have that is once we have our UX and our UI framework
[00:17:24] in place and we have our backend actually set up and we know what the database is going to look like and we
[00:17:30] have all the business logic built. We need to build the front end that merges those two worlds together to make a
[00:17:36] functional app that a user can interact with. because abstract UX and UI theory
[00:17:41] that's great but we at the end of the day need that translated into a snappy
[00:17:46] performant front end. And so what we're going to do is we give the UXUI documentation, our backend
[00:17:52] documentation, everything that we have so far to date pretty much and we build
[00:17:57] out our system of reusable components, what our state management system is going to look like for the app, building
[00:18:03] the actual interactivity that we've now just talked about in the UX portion. All of that stuff needs to now come alive.
[00:18:09] And so, like I said earlier, this video is not going to be a full app build. That's coming later. So, we're now just going to look at some of these agent
[00:18:17] configurations that I have built for you inside of this doc. So, like I said, our
[00:18:22] front-end engineer is going to transform our technical specifications, the API,
[00:18:27] the design systems, all of that stuff into a production ready user interface. So, how do we go about doing that? Well,
[00:18:34] first we're going to tell it the inputs it should expect, which we've built now in previous stages with the exception of
[00:18:40] this backend engineer that we'll look at after this one. And then we give it some guidelines about how to actually
[00:18:45] approach this implementation. So, first we need to break everything down step by step. Look at those user stories and the
[00:18:52] backend and all of our requirements and break it down into steps. We need to actually implement the design system. So
[00:18:59] if we were using Tailwind for example, creating that tokenbased design system, we need to actually create our systems
[00:19:05] that are going to go fetch the data we need from the back end and store that data intelligently in the front end
[00:19:10] where it's needed. We need to actually build out that core user experience. We need to make sure it performs well, that
[00:19:17] it's fast, it's snappy, there's not weird stuff happening. And then we give it some other guidelines around how to
[00:19:22] actually organize itself, how should it code, and then when it's done, it returns us a comprehensive
[00:19:28] documentation. so that we can actually know what is built. We can go we can look at it. We can understand how it
[00:19:34] functions. So that out of the way, we need to actually loop back a second because the front end is very much
[00:19:41] dependent upon what we build in the back end, right? What's the actual business logic of this thing? Because the backend
[00:19:47] is what actually powers the core experience of the app and so it needs to be done very well. So much to the
[00:19:54] contrary actually of how vibe coding is typically shown to people, it's a very visual thing. And so we don't tend to
[00:20:00] think about well what's the business logic under the hood that's going to actually power this thing because again
[00:20:06] the backend is the real workhorse of the app. It does all the heavy lifting. It's
[00:20:11] builds the core logic so that you know this thing actually turns on and works. And so what we're looking to build in
[00:20:18] this piece is we want to pass in that architecture plan and what the feature requirements are going to be. And out
[00:20:23] the other side, we want all of our API endpoints, the database schemas, the business logic, the authentication and
[00:20:30] the authorization of requests that are being made. We want all of that stuff before we really go and build the front
[00:20:36] end. And so here we can see that prompt. So again, we are practicing a specdriven
[00:20:42] development, which means we're going to take the technical documentation and the stories that we have. And from that, we
[00:20:48] will build the backend. And so again, we're telling it what to expect as an input. So it's going to have all of the
[00:20:54] technical documentation we've done to date. And so from there, we're just telling it how to do its job properly.
[00:21:00] So for example, how should you handle database migration so that things aren't breaking on you and you want to smash
[00:21:05] your head against a keyboard? How are we going to develop our API? How are we going to integrate with external
[00:21:11] systems? What does the core business logic of this app need to actually look like? How can we optimize our backend
[00:21:18] for performance and scalability? So all of this stuff is what we now want to
[00:21:23] consider. And then again, we give it our recommended implementation approach. We want you to analyze the specs. We want
[00:21:29] you to plan out the database. We want you to run any migrations, build the logic, make sure it's tight from a
[00:21:37] security perspective, make sure it's performant, obviously, handle all the edge cases, and so on. And then again,
[00:21:43] like everything else, we're telling it what we want the output to look like. So, all of this has been great so far. We've architected our our app. We've
[00:21:50] built out the front-end components. We've built out the backend components. But one of the things that is going to enable you to build something that
[00:21:56] actually works in production is that you need to have a proper QA and testing
[00:22:02] environment setup, which most vibe coders don't even think about because you cannot rely on the happy path of
[00:22:10] what we wish would happen. Especially if you're vibe coding without a lot of testing in place, you might be breaking
[00:22:16] things that used to work. And if you're not super on top of every single file that you're editing, that is a
[00:22:23] likelihood. It is an inevitability. And so you need to just plan for it. But we
[00:22:28] still want to build fearlessly at high speed. And so that is what this is meant to help us do. And so the one big
[00:22:34] difference for this one compared with other ones that we've seen is that it's a lot more context dependent. meaning I
[00:22:42] only wanted to execute pieces of this system prompt that actually make sense relative to what is being asked. Now, in
[00:22:49] an ideal world, you could probably split this into like a a back-end testing agent versus a front-end testing agent
[00:22:55] or an endto-end testing agent, but I'm using this all in one. So, maybe not token efficient, but it does the job.
[00:23:02] And so, we're telling it you're going to be invoked in one of three specific contexts. You're either going to be testing the back-end functions which
[00:23:09] have their own considerations, the front-end functions, which have their own considerations, or you're going to
[00:23:14] be running endtoend testing. Meaning, we're going to identify like that top 10% critical path that we can never have
[00:23:21] break. And we are going to have robust end-to-end testing that is done for those features. So, how does it do this?
[00:23:28] Well, it needs to analyze our tech specifications. It needs to plan the test out. It needs to implement the test
[00:23:34] depending again is it backend, is it front end, is it end to end. And then we want to make sure that our tests are
[00:23:40] they're clean, they're readable, they they follow conventions that we've already set in our app and that any
[00:23:46] critical bugs are actually getting like reported back to us as a user and that we have full test coverage of our entire
[00:23:53] app. So, a brief little aside here on testing. This is one of the things when I first started using Amazon's Kirao
[00:24:00] that I really appreciated more than anything is that it writes tests before
[00:24:05] it even builds the features. And obviously that's a very robust and safe way to go about your development because
[00:24:11] you're ensuring at every step of the process that this thing is tested and that it is working. And then when you go
[00:24:17] to build your app and push it into production, you can run all of those tests before it pushes and make sure
[00:24:22] that you didn't just screw yourself. So if you leave this out of your process, then all of your future sadness is on
[00:24:29] you. Now our last two agents are also super critical to the process. We have our DevOps agent and we have our
[00:24:35] security analyst. The DevOps agent, I kind of showed you the output of that, so I'll be brief. Inevitably, we need to
[00:24:41] get our app into the hands of people. And so we need to be able to handle the stresses of those people interacting
[00:24:48] with our system and us trying to develop quickly while not breaking the system that is there. So this agent is meant to
[00:24:55] automate that all as best we can. So basically what we're going to do is we're going to give it our code and
[00:25:00] everything we've built and it's going to give us back all of the configurations that we need in order to deploy this
[00:25:07] thing. So we're talking about Docker file configurations, GitHub actions, an
[00:25:13] actual integration and deployment pipeline that can run our tests automatically before it tries to deploy
[00:25:20] and tells us if it failed and doesn't deploy it if it failed. All of that stuff is super super important and
[00:25:25] that's what this agent is meant to do. So, similar to our QA agent, there are different scopes where we're going to be
[00:25:32] invoking this thing. And this is a personal preference. When I'm in the early stages of my process and I'm
[00:25:38] developing for myself or it's just like a tiny little project, I like to do a lot of things locally. And so before I
[00:25:44] start building my backend and my front end, I want to make sure that I can actually like run things in Docker and
[00:25:50] it's running locally on my machine. And so if that is the stage we're in, then it's going to invoke this local
[00:25:55] development mode. But if we're in we're past stage five and we're ready to to run this thing and send it into
[00:26:01] production, it's going to build out a production deployment system. So again,
[00:26:06] we're telling it what are the inputs that it's going to have. What are the different tech stacks that it might have
[00:26:11] and need to conform to? What do we want local development environments to
[00:26:17] actually look like for us? What are our principles for local development which might be different, right? We might be
[00:26:24] wanting to optimize for this the speed of things instead of being super production optimized for example. And so
[00:26:30] we continue on and on just outlining these production considerations versus these local development considerations.
[00:26:37] How should secrets be managed? What are our deployment scripts going to look like? How will we again integrate testing into it? And all of that good
[00:26:45] stuff. So, last but definitely not least is our security analyst. Now, one of the
[00:26:51] biggest honestly validated piles of that get thrown at vibe coders is that
[00:26:56] the apps tend to have security flaws. And the last thing we want to do is try to build something that's actually meant
[00:27:02] to help people and then have it the bed because we did something really dumb because a single security problem can
[00:27:10] literally ruin your business overnight. There's been a lot of really high-profile vibecoded app cases of this
[00:27:16] recently. And I'll be honest, you can't possibly be a security expert on top of
[00:27:23] every other thing we're trying to do. So, we need to try to leverage these tools as best as possible. So, this
[00:27:30] agent is meant to be our ondemand security analyst that can look through everything we've built and check it
[00:27:35] against known best practices, research the web for known vulnerabilities, make sure those aren't in our apps, use known
[00:27:43] MCP servers that can actually scrub through our app and make sure that we're
[00:27:48] not doing stuff that's really dumb. That's what we want to do in this stage. Make sure we're not shooting ourselves in the foot and shooting people that
[00:27:55] might trust us in the foot. Now, at the risk of this video going super long and knowing that I'm literally going to do
[00:28:01] this in the next video for a full app build, I'm not going to go through this in detail, but again, you all have
[00:28:07] access to this entire prompt if you want it. And again, it's going through things
[00:28:12] like, hey, here's how we protect our API endpoints. Here's how we can make sure there's not clear issues with some of
[00:28:18] our dependencies that we have in our projects, things like that. So, boom.
[00:28:23] You just saw how to set up a dope army of agents to make your dreams come true.
[00:28:31] I love Claude Code agents. I think this is one of the best things that has been made this year. And I think I've made
[00:28:37] that claim two times maybe. So, it's August. I think I can make that third claim. We get one awesome thing per
[00:28:43] quarter. Now, again, knowing that we have these awesome reasoning agents that we can use, that's only half the battle.
[00:28:50] So the next video we're going to take these things and orchestrate them into a phased system where we loop through with
[00:28:56] some of them and actually build new features. So we're going to go from a raw idea through to a fully complete
[00:29:04] project, something that people can actually sign up for and pay money for. So code, databases,
[00:29:11] deployments, the whole thing. And I'm going to try to get the whole thing done in a day, if not a weekend. But here's
[00:29:19] the catch, because there's always a catch. While this may just be the best video I think that I ever made, or maybe
[00:29:26] I was just really happy this morning thinking about this video, the YouTube algorithm is brutal for creators that
[00:29:32] are like under 50,000 subs. It's actually really hard to get traction on videos. Sometimes it can feel like
[00:29:37] you're shouting off into the void. So, if you don't subscribe and hit the notification bell, there's good odds we
[00:29:44] might never see each other ever again. And I'll be honest with you, you really
[00:29:50] do not want to miss the next video cuz it's going to be dope. So, Hulk smash
[00:29:56] that subscribe button and tell me in the comments if you have an idea for an app that you want to see me build cuz maybe,
[00:30:03] just maybe, that will be the one that I choose to do. So, that's it. Get the
[00:30:08] agents in the dock below in the video. Until next time, peace
