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
    bot.dialog('/', [
        function (session, results, next) {
            builder.Prompts.text(session, '¿Cómo te llamas?');
        },
        function (session, results) {
            session.dialogData.nombre = results.response;
            builder.Prompts.number(session, `Ok, ${session.dialogData.nombre}. ¿Cuál es tu edad?`);
        },
        function (session, results) {
            session.dialogData.edad = results.response;
            builder.Prompts.time(session, `¿Qué hora es?`);
        },
        function (session, results) {
            session.dialogData.hora = builder.EntityRecognizer.resolveTime([results.response]);
            builder.Prompts.choice(session, '¿Cuál prefieres?', 'Mar|Montaña', { listStyle: builder.ListStyle.button });
        },
        function (session, results) {
            session.dialogData.preferencia = results.response.entity;
            builder.Prompts.confirm(session, '¿Quieres ver un resumen?', { listStyle: builder.ListStyle.button });
        },
        function (session, results) {
            if (results.response) {
                session.endDialog(`Me contaste que tu nombre es **${session.dialogData.nombre}**, tienes **${session.dialogData.edad}** años, son las **${session.dialogData.hora}** y prefieres **${session.dialogData.preferencia}**`);
            }
            else {
                session.endDialog('Adios!');
            }
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
