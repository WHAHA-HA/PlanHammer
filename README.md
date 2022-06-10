#PlanHammer
After installing node.js 

###Resolve dependencies
To resolve dependencies need to run in project folder:   
    `npm install`


###Running the app
To run in project folder execute: 
    `node app.js`

`NODE_ENV` variable define environment that will be used
Locally server could be started with next line `node app.js`, by default used NODE_ENV=development and could be changed to `NODE_ENV=test node app.js` for example.

###Using
After running the app it should be available on default port 3000 by address `http://localhost:3000/`

###Deploy
App is deployed on server automatically after each commit to master branch.     

It can be restarted using `forever restart prod` 
and run from project folder using command: `NODE_ENV=production port=80 forever --uid prod -a start app.js` 

###Switching dev/prod
Switching between development and production mode should be described in configs/[env].js file, where exists separate json file for each enviroment, everything should be separated mongodb, mail, payments, domain and other specific for every environment stuff.

###MongoDB
Starting mongo service `service mongod start`