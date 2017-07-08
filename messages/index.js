// For more information about this template visit http://aka.ms/azurebots-node-qnamaker

"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var builder_cognitiveservices = require("botbuilder-cognitiveservices");
var path = require('path');

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);
bot.localePath(path.join(__dirname, './locale'));

var recognizer = new builder_cognitiveservices.QnAMakerRecognizer({
                knowledgeBaseId: process.env.QnAKnowledgebaseId, 
    subscriptionKey: process.env.QnASubscriptionKey});

var basicQnAMakerDialog = new builder_cognitiveservices.QnAMakerDialog({
    recognizers: [recognizer],
                defaultMessage: 'No match! Try changing the query terms!',
                qnaThreshold: 0.3}
);

    // ************** El código aquí *****************
    
    // Dialogos
    bot.dialog("/", [
        function(session)
        {
            session.beginDialog("/preguntarDatosPersonales");
        },
        function(session)
        {
            // Crear targeta final, para que me sigan en twitter
            var twitterCard = new builder.HeroCard(session)
                .title("Gracias por tu colaboración")
                .text("Si quieres mas sobre bots, sigan en Twitter a @rarrebolaedcm15")
                .images([
                    builder.CardImage.create(session, "https://avatars1.githubusercontent.com/u/6422482?v=3&s=400")
                ])
                .buttons([
                    builder.CardAction.openUrl(session, "https://twitter.com/rarrebolaedcm15", "Sígueme en Twitter")
                ]);
            
            // Adjuntamos la targeta al mensaje
            var msj = new builder.Message(session).addAttachment(twitterCard);
            session.send(msj);

        }
    ]);

    bot.dialog("/preguntarDatosPersonales", [
        function(session, next)
        {   
            // Preguntamos el nombre
            builder.Prompts.text(session, "¿Cómo te llamas?");
        },
        function(session, result)
        {
            // Guardamos el nombre
            session.userData.username = result.response;

            // Preguntamos la edad
            builder.Prompts.text(session, "¿Que edad tienes?");
        },
        function(session, result)
        {
            // Guardamos la edad
            session.userData.edad = result.response;

            // Finalizamos este dialogo con el bot
            session.endDialog(`Gracias ${session.userData.username}, he memorizado tus datos`);
        }
    ]);

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
    
} else {
    module.exports = { default: connector.listen() }
}
