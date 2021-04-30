const Discord = require("discord.js")
const chess = require('chess');
const process = require('process');
const ChessImageGenerator = require('chess-image-generator');
const { prefix,token } = require("./config.json")

const client = new Discord.Client()
let players = []
const imageGenerator = new ChessImageGenerator({
    size: 360,
    style: 'merida'
});
let pgnString = ""
let moveCount=0
let white_turn = true   
let gameClient,move,status,draw,checkmated

client.on('ready',()=>{
    console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message',message=>{
    if(draw)
    {
        message.channel.send("Game Drawn 0.5-0.5!")
        players = []
        white_turn=true
        pgnString = ""
        moveCount=0
    }
    if (checkmated)
    {
        message.channel.send("Decisive Game!")
        players = []
        white_turn=true
        pgnString = ""
        moveCount=0
    }
    if (!message.content.startsWith(prefix) || message.author.bot) return
    
    const args = message.content.slice(prefix.length).trim().split(/ +/)
    const command = args.shift().toLowerCase();
    
    if (command==="playchess")
    {
        if (players.length == 2) {
            message.channel.send("Players are currently busy with the board!")
        }

        else {
            const taggedUser = message.mentions.users.first()
            message.channel.send(`Creating chess game with : ${taggedUser} as black and ${message.author} as white`)
            players[0] = message.author
            players[1] = taggedUser
            gameClient = chess.create({PGN : true})
        }
    }

    else if(command==="playmove")
    {

        if(message.author===players[0] || message.author===players[1])
        {
            if((white_turn && message.author==players[1]) || (!white_turn && message.author===players[0]))
            {
                message.channel.send(`Please wait for your turn ${message.author}`)
            }
            let opponent = message.author===players[0]?players[1]:players[0]
            status = gameClient.getStatus();
            legalMoves = Object.keys(status.notatedMoves)
            //console.log(status)
            //console.log(legalMoves)
            if(legalMoves.includes(args[0]))
            {
                if(white_turn)
                {
                    moveCount = moveCount+1;
                    let moveString = moveCount.toString()+". "+args[0]+" "
                    pgnString = pgnString+moveString
                }
                else
                {
                    let moveString = args[0]+" "
                    pgnString = pgnString+moveString
                }
                move = gameClient.move(args[0])
                draw = status.isRepetition || status.isStalemate
                checkmated = status.isCheckmate
                message.channel.send(`${opponent}, your opponent has played ${args[0]}`)
                white_turn = !white_turn
            }
            else
            {
                message.channel.send(`${message.author}, the move is not legal!`)
            }
            
                
        }

        else{
            message.channel.send(`Sorry ${message.author}, you are not a player in this match`)
        }
    }

    else if(command==="resign"){
        let opponent = message.author===players[0]?players[1]:players[0]
        message.channel.send(`${opponent} is victorious!`)
    }

    else if(command==="abort"){
        players = []
    }

    else if(command==="analyze"){
        message.channel.send("Here is a link to a lichess analysis board : ")
    }
    else if(command==="showposition")
    {
        imageGenerator.loadPGN(pgnString)
        console.log(pgnString)
        console.log(process.cwd())
        imageGenerator.generatePNG(process.cwd()+"\\chessposition.png").then(()=>{
            console.log("Rendered Position");
            message.channel.send('The live position',{
                files : ["./chessposition.png"]
            })
        }).catch((e)=>{
            console.log(e);
        })
        
    }

    
})


client.login(token)