"use strict";


// creating reference var to db
const request = indexedDB.open("budget", 1);
//creating var for the pending status for the store
const pendingObjectStoreName = `pending`;
// runs whenever a new db event is created
request.onupgradeneeded = (event)=> {
    console.log(request);
    const db = request.result;
    console.log(event);

    if (!db.objectStoreNames.contains(pendingObjectStoreName)) {
        db.createObjectStore(pendingObjectStoreName, { autoIncrement: true });
    }
};
// if db is already created then logs err of event
request.onerror = event => console.error(event);
// if success logging the event,
request.onsuccess = event => {
    console.log(`${event.type}`);
    db = event.target.result;
    //if db connect is online
    if (navigator.onLine) {
        console.log("online");
    }
};


//checks the db for a transaction to the store
function checkDatabase() {
    const db = request.result;
    // open a transaction
    let transaction = db.transaction([pendingObjectStoreName], `readwrite`);
    // open object store
    let store = transaction.objectStore(pendingObjectStoreName);
    // get all records from store and set to a variable
    const getAll = store.getAll();

        // getting all successful post methods
    getAll.onsuccess = () => {
        if (getAll.result.length > 0) {
            fetch(`/api/transaction/bulk`, {
                method: `POST`,
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: `application/json, text/plain, */*`,
                    "Content-Type": `application/json`
                }
            })
            //promise to open a transaction to the store and any pending transaction, and clearing the transaction
                .then(response => response.json())
                .then(() => {
                    transaction = db.transaction([pendingObjectStoreName], `readwrite`);
                    store = transaction.objectStore(pendingObjectStoreName);
                    store.clear();
                });
        }
    };
}

//the saveRecord  function saves the record to the db for readwrite access
function saveRecord(record) {
    const db = request.result;
    const transaction = db.transaction([pendingObjectStoreName], `readwrite`);
    const store = transaction.objectStore(pendingObjectStoreName);
    // add record 
    store.add(record);
}

// listen for app 
window.addEventListener(`online`, checkDatabase);