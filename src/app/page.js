
//The component should be treated as a client-side component. In the Next.js,
//this ensures that the component runs only on the client side, which is essential 
//for using hooks like 'useState' and 'useEffect' that don't work during server-side rendering
'use client' // indicates that this is a client-side component.

import { useState, useEffect } from 'react'; //for managing state and side effects 
import { Box, Stack, Typography, Button, Modal, TextField } from '@mui/material';
import { firestore } from '@/firebase';
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import CameraCapture from './CameraCapture';

//Javascript obj defining the styles for the modal component
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

//React component that returns JSX
export default function Home() {

  //State Management
  //these will manage our inventory list, modal state, and new item input respecitvely
  const [inventory, setInventory] = useState([]) //inventory holds the list of the inventory items | setInventory func updates the inventory stat
  const [open, setOpen] = useState(false) //open holds a bool val indicating whether a modal is open or closed
  const [itemName, setItemName] = useState('') //itemName holds an empty string 
  // We'll add our component logic here


  //This function queries the 'inventory' collection in Firestore and updates the local state
  const updateInventory = async () => { //declare async func

    //Querying firestore collection
    //creates a ref to the inventory collection in the firestore database
    //fetch all documents in the collection
    const snapshot = query(collection(firestore, 'inventory')) 

    //Fetching inventory collection
    //excute the query and returns all docs matching the query
    const docs = await getDocs(snapshot)

    const inventoryList = [] //initialize an empty array to store the inventory items

    docs.forEach((doc) => { //iterate over each document in the docs array
      inventoryList.push({ name: doc.id, ...doc.data() }) //add to the inventoryList array
    })
    setInventory(inventoryList) //update the local state
  };

  //The 'useEffect' hook ensures this run when the component mounts
  //React func to perform side effects in functional components
  useEffect(() => {
    updateInventory()
  }, []);


  //The following two functions are for adding and removing items into and from inventory
  //These functions interact with Firestore to add or remove items and update our local state

  //This function adds items into inventory
  const addItem = async (item) => {
    //creates a ref to the document in the inventory collection in Firestore
    const docRef = doc(collection(firestore, 'inventory'), item);

    //fetch the doc snapshot from the inventory collection in firestore
    const docSnap = await getDoc(docRef);

    //update quantity if document exists
    if (docSnap.exists()) {
      const { quantity } = docSnap.data(); // extract the 'quantity' field from the document data
      await setDoc(docRef, { quantity: quantity + 1 }); //update the document by increasing the quantity by 1

    } 
    else {
      await setDoc(docRef, { quantity: 1 }); //set the quantity in the document ref to 1
    }

    await updateInventory(); //refresh the inventory data
  }


  //This function removes items from inventory
  const removeItem = async (item) => {

    //create a ref to a doc in inventory collection in firestore
    const docRef = doc(collection(firestore, 'inventory'), item);

    //fetch the doc from the inventory collection in firestore
    const docSnap = await getDoc(docRef)


    if (docSnap.exists()) {// if the doc exists

      const { quantity } = docSnap.data(); //extract the 'quantity' field from the document data

      if (quantity === 1) { //if there is only one quantity of that item in inventory collection, remove it
        await deleteDoc(docRef);

      } 
      else { 
        await setDoc(docRef, { quantity: quantity - 1 }); //update the quantity by decrementing the quantity by 1
      }
    }
    await updateInventory(); //refresh the inventory data
  }

  //Add modal control funcs
  const handleOpen = () => setOpen(true); //indicate that the model should be displayed
  const handleClose = () => setOpen(false); //indicate that the model should be hidden

  //process the detected obj by adding each detected obj's class to the inventory
  const handleCapture = (imageURL, detectedObjects) => {
    console.log('handleCapture called with detectedObjects:', detectedObjects); // Log detected objects
    detectedObjects.forEach((obj) => {
      console.log('Adding item:', obj.class);
      addItem(obj.class);
    });
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display={'flex'}
      justifyContent={'center'}
      flexDirection={'column'}
      alignItems={'center'}
      gap={2}
    >
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Add Item
          </Typography>
          <Stack width="100%" direction={'row'} spacing={2}>
            <TextField
              id="outlined-basic"
              label="Item"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <Button
              variant="outlined"
              onClick={() => {
                addItem(itemName)
                setItemName('')
                handleClose()
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
      <Button variant="contained" onClick={handleOpen}>
        Add New Item
      </Button>

      <CameraCapture onCapture={handleCapture} />   {/* Add the CameraCapture component */}

      <Box border={'1px solid #333'}>
        <Box
          width="800px"
          height="100px"
          bgcolor={'#ADD8E6'}
          display={'flex'}
          justifyContent={'center'}
          alignItems={'center'}
        >
          <Typography variant={'h2'} color={'#333'} textAlign={'center'}>
            Inventory Items
          </Typography>
        </Box>
        <Stack width="800px" height="300px" spacing={2} overflow={'auto'}>
          {inventory.map(({name, quantity}) => (
            <Box
              key={name}
              width="100%"
              minHeight="150px"
              display={'flex'}
              justifyContent={'space-between'}
              alignItems={'center'}
              bgcolor={'#f0f0f0'}
              paddingX={5}
            >
              <Typography variant={'h3'} color={'#333'} textAlign={'center'}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </Typography>
              <Typography variant={'h3'} color={'#333'} textAlign={'center'}>
                Quantity: {quantity}
              </Typography>
              <Button variant="contained" onClick={() => removeItem(name)}>
                Remove
              </Button>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  )
}
