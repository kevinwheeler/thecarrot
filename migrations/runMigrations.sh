#TODO don't have these hardcoded.
export MONGODB_URI=mongodb://development:localdev2@ds011495.mlab.com:11495/heroku_z84wknmq
export WRITE_CONCERN=0
export JOURNAL_CONCERN=FALSE

while true; do
    read -p "Remember, MONGODB_URI, WRITE_CONERN, and JOURNAL_CONERN are all hardcoded right now. Enter y to continue. " yn
    case $yn in
        [Yy]* ) echo "Running script."; break;;
        * ) echo "You didn't press y. Exiting now.";exit;;
    esac
done

node ./individualMigrations/1createCountersCollection.js
# Add more later, but right now I'm going to harcode in mongouri into 2nd individual migration, so not adding a line for it here right now.
