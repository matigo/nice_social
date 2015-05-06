# Nice.Social
### An Open-Source Web Client for App.Net

App.net is a social platform that enables people to accomplish a lot of goals, but it's most well-known for its microblogging community *(and slightly storied history)*. Nice.Social is a web application that was created to provide a tool that anybody could use to see a Filtered, mostly Spam-Free Global timeline in addition to their own in a single location. Nice.Social is an interactive tool, but can be used as a way to passively observe community interactions as well.

This code does not send any personal data to 3rd-party servers. All information is kept solely in the web browser or sent directly to the App.net servers. A NiceRank Index is downloaded from api.nice.social at launch and every hour afterwards to provide a list of accounts and their NiceRank scores. NiceRank is how the web application can effectively filter the Global Timeline to show primarily human-powered accounts and their interactions.

As with everything on GitHub, this project is a work in progress and you are welcome to contribute code, support tickets, and chocolate chip cookies to help make this tool better for everyone.

Want to see this code in action? Drop it in at directory on your computer or head over to [Nice.Social](https://nice.social).

***Please Note**: This version of the software is slightly different from the one powering the Nice.Social website. That said, any updates to the main site will be reflected here within a matter of hours or less.*

###Usage

Using this code really couldn't be easier. Put the files somewhere. Access the `index.html` file. Everything is done through JavaScript and jQuery.

###Customisation

In order to use this website to interact with the App.Net API, you will need an Application Client ID. You can [get one for free with your App.Net account](https://account.app.net/developer/apps/) regardless of whether you have a free, paid, or developer account. Don't worry about the exclamation mark message unless you do not see the "Create App" button.

![Create Application](https://nice.social/themes/mono/img/1_create_app.jpg)

Next you can enter the name and website of your application. If you plan on running these files from your computer, just enter anything into the website field.

![Create Application](https://nice.social/themes/mono/img/2_create_app.jpg)

The third and final screen will give you the necessary `client_id` to interact with App.Net.

![Create Application](https://nice.social/themes/mono/img/3_create_app.jpg)

On this third screen you will also see a place for "Redirect URIs". You will need a good URI in this area before you can log in to App.net. If you are running the web application from a web server, enter the website address here. If you're running it from your computer, you can enter a `file:///` URI. For example: `file:///Users/jason/Git/nice_social/index.html`.

Now, copy the file `config.sample.js` to `config.js` and edit it.

Replace `[YOUR_API_TOKEN]` with the API Token (Client ID) granted by App.net, and `[YOUR_REDIRECT_URI]` with the URI where `index.html` can be accessed. For example:

    `apiToken: 'abcdefghijklmnopqrstuvwxyz0123456789',`
    `redirect: 'http://my.nice.app', //You can use your 'file:///' URI here, too`

That's all there is to it. No special libraries, compiling, or other complex steps are required. Heck, this alone was complicated enough.

Questions? Get in touch with [@matigo](https://alpha.app.net/matigo) on App.net.

###API Reference

* https://api.nice.social/user/nicesummary :: NiceRank Account Summary
* https://api.app.net/* :: App.Net Interactions

***Note:** No Google, Facebook, Twitter, or other 3rd-party APIs or resources are used with this tool.*

None of your personal data is shared with any of my servers. Your data is none of my business. Don't believe me? You can check the code yourself or ask someone nicely `:)`

###Contributors

The list below is not very long. Let's make it impressive! Help Nice.Social by contributing some code, bug reports, and/or chocolate chip cookies and add your name below.

* [@matigo - Jason F. Irwin](https://alpha.app.net/matigo)

###License

This project is run under the MIT License. This is a permissive, free software license, meaning that it permits reuse within proprietary software provided all copies of the licensed software include a copy of the MIT License terms and the copyright notice. Such proprietary software retains its proprietary nature even though it incorporates software under the MIT License. This license is also GPL-compatible, meaning that the GPL permits combination and redistribution with software that uses the MIT License.