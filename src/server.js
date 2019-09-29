import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';


const app = express();
app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());
const withDB = async (operations, res) => {
    try {

        
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
        const db = client.db('nicholas-blog');
        await operations(db);
        client.close();
    } catch (error) {
        res.status(500).json({ message: 'Error connection', error});
    }


}
app.get('/api/articles/:name', async (req,res) => {
        withDB(async (db) => {
            const articleName = req.params.name;
            
            const articleInfo = await db.collection('articles').findOne({ name: articleName });
            res.status(200).json(articleInfo);
        }, res);
})

app.get('/api/articles', async (req,res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
        
        const articles = await db.collection('articles').find().toArray();
        res.status(200).json(articles);
    }, res);
})


app.post('/api/articles/:name/upvote', async (req,res) => {

    withDB(async (db) => {
        const articleName = req.params.name;
    

        const articleInfo = await db.collection('articles').findOne({name: articleName});
        await db.collection('articles').updateOne({ name: articleName}, {
            '$set': {
                upvotes: articleInfo.upvotes + 1,
    
            },
        }, res);
        const updateArticleInfo = await db.collection('articles').findOne({name: articleName});
        res.status(200).json(updateArticleInfo);


    })
    
    
});



app.post('/api/articles/:name/add-comment', (req,res) => {
    const{ username, text } = req.body;
    const articleName = req.params.name;
    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({name: articleName});
        await db.collection('articles').updateOne({name: articleName}, {
            '$set': {
                comments: articleInfo.comments.concat({username, text}),

            },
        }, res);
        const updateArticleInfo = await db.collection('articles').findOne({name: articleName});
        res.status(200).json(updateArticleInfo);
    })
});

// Test
app.post('/api/articles', (req,res) => {
    const{title, postText, username, upvotes, comments} = req.body;
    withDB(async (db) => {
        await db.collection('articles').insertOne( {name: title, body: postText, author: username, upvotes: upvotes, comments: comments } )
        const updateArticleList = await db.collection('articles').findOne({name: title});
        res.status(200).json(updateArticleList);
    })
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})


app.listen(8080, () => console.log('Listening on port 8080'));