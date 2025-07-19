const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const WebSocket = require('ws');
const axios = require('axios');

const port = new SerialPort({ path: '/dev/ttyUSB1', baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

const wss = new WebSocket.Server({ port: 8081 });

console.log('RFID reader server running...');

parser.on('data', async (line) => {
  try {
    const match = line.match(/RFID (\d+) UID: (.+)/);
    if (!match) return;

    const readerId = parseInt(match[1], 10); 
    const uid = match[2].trim();

    
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ uid, readerId }));
      }
    });

    if(readerId == 1){
      console.log(uid)
      const cardRes = await axios.get(`http://127.0.0.1:8000/rfid_cards/uid/${uid}`);
      const cardData = cardRes.data;

      if (!cardData || !cardData.user_id) {
        return;
      }

      const userRes = await axios.get(`http://127.0.0.1:8000/users/${cardData.user_id}`);
      const user = userRes.data;

      if (user.is_admin && user.status === 'active') {
        await axios.patch(`http://127.0.0.1:8000/users/users/${user.user_id}/last_entry`);
        await axios.patch(`http://127.0.0.1:8000/users/edit/is_inside/${user.user_id}`);
        
        const message = `🚪 Turniket Girişi - ADMIN\n👤 Ad Soyad: ${user.first_name} ${user.last_name}`;     
        await axios.post("http://127.0.0.1:8000/telegram/send-message/", { text: message });
        await axios.post('http://127.0.0.1:8000/open-gate');
      }

      else if(!user.is_admin  && user.status == "active" && user.entry_count-1 >= 0){
        if(user.is_inside){
          await axios.patch(`http://127.0.0.1:8000/users/edit/is_inside/${user.user_id}`);
          await axios.post('http://127.0.0.1:8000/open-gate');  
        }
        else{
          await axios.patch(`http://127.0.0.1:8000/users/edit/remove_one/${user.user_id}`);
          await axios.patch(`http://127.0.0.1:8000/users/users/${user.user_id}/last_entry`);
          await axios.patch(`http://127.0.0.1:8000/users/edit/is_inside/${user.user_id}`);
          
          const message = `🚪 Turniket Girişi - Müştəri\n👤 Ad Soyad: ${user.first_name} ${user.last_name}`;     
          await axios.post("http://127.0.0.1:8000/telegram/send-message/", { text: message });
          await axios.post('http://127.0.0.1:8000/open-gate');
        }
      }

      else if(user.membership_id == "Limitsiz" && user.status == "active"){
        if(user.is_indie){
          await axios.patch(`http://127.0.0.1:8000/users/edit/is_inside/${user.user_id}`);
          await axios.post('http://127.0.0.1:8000/open-gate');  
        }
        else{
          await axios.patch(`http://127.0.0.1:8000/users/users/${user.user_id}/last_entry`);
          await axios.patch(`http://127.0.0.1:8000/users/edit/is_inside/${user.user_id}`);
          
          const message = `🚪 Turniket Girişi - Müştəri\n👤 Ad Soyad: ${user.first_name} ${user.last_name}`;     
          await axios.post("http://127.0.0.1:8000/telegram/send-message/", { text: message });
          await axios.post('http://127.0.0.1:8000/open-gate');

        }
      }

    }
    else{
      console.log(uid)
    }
    

  } catch (err) {
    console.error('Error in processing RFID card:', err.message);
  }
});