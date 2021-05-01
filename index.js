const Discord = require("discord.js")
const chess = require('chess');
const process = require('process');
const axios = require("axios")
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
            console.log(status.isCheckmate)
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
                status = gameClient.getStatus()
                draw = status.isRepetition || status.isStalemate
                checkmated = status.isCheckmate
                // console.log("JERE",checkmated)
                if(!(checkmated || draw))
                {
                    message.channel.send(`${opponent}, your opponent has played ${args[0]}`)
                    white_turn = !white_turn
                }
                else
                {
                    white_turn=true
                    pgnString=""
                    moveCount=0
                    gameClient.status = {}
                    message.channel.send("CHECKMATED!")
                    players = []
                }
                
                
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
        white_turn=true
        pgnString=""
        moveCount=0
        gameClient.status = {}
        players = []
    }

    else if(command==="abort"){
        white_turn=true
        pgnString=""
        moveCount=0
        gameClient.status = {}
        message.channel.send("Game Aborted.")
        players = []

    }

    else if(command==="analyze"){
        axios.post("https://lichess.org/api/import",{
            pgn : pgnString
        }).then(res =>{
            console.log(res.data)
            message.channel.send("Here is a link to a lichess analysis board : " + res.data.url)   
        }).catch(err =>{
            console.log()
            message.channel.send("Error creating analysis board. Please try again later.")
        })
        
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