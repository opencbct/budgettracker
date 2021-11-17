"use strict";

const pendingObjectStoreName = `pending`;
// creating reference var to db
const request = indexedDB.open("budget", 1);


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



function checkDatabase() {
    const db = request.result;
    // open a transaction on your pending db
    let transaction = db.transaction([pendingObjectStoreName], `readwrite`);
    // access your pending object store
    let store = transaction.objectStore(pendingObjectStoreName);

    // get all records from store and set to a variable
    const getAll = store.getAll();

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
                .then(response => response.json())
                .then(() => {
                    // if successful, open a transaction on your pending db
                    transaction = db.transaction([pendingObjectStoreName], `readwrite`);

                    // access your pending object store
                    store = transaction.objectStore(pendingObjectStoreName);

                    // clear all items in your store
                    store.clear();
                });
        }
    };
}

// eslint-disable-next-line no-unused-vars
function saveRecord(record) {
    const db = request.result;

    // create a transaction on the pending db with readwrite access
    const transaction = db.transaction([pendingObjectStoreName], `readwrite`);

    // access your pending object store
    const store = transaction.objectStore(pendingObjectStoreName);

    // add record to your store with add method.
    store.add(record);
}

// listen for app coming back online
window.addEventListener(`online`, checkDatabase);