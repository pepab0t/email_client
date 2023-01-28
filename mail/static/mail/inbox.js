
const url = "http://127.0.0.1:8000"

document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // submit form
  document.querySelector('#compose-form').onsubmit = () => 
   {
    removeMessages();
    const to = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    if (!to) {
      const p = document.createElement('p');
      p.innerHTML = "Recipients must be non blank field.";
      p.style = 'color: red';
      document.querySelector('#messages').append(p);
      return false;
    } else if (!subject) {
      return false;
    } else if (!body) {
      return false;
    }

    fetch(`${url}/emails`, {
      method: 'POST',
      body: JSON.stringify({
        recipients: to,
        subject: subject,
        body: body
      })
    })
    .then(response => {
        if (response.ok){
          return response.json();
        } else {
          document.querySelector('#messages').append(respose.json().error)
          throw new Error(`Invalid response: ${response.json().error}`)
        }
    })
    .then((result) => {
      load_mailbox('sent');
      console.log(result);
    })
    .catch(e => {
      console.log(e);
    });

    return false;
  };

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {
  // remove all messages
  removeMessages();

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  
  emailView = document.querySelector('#emails-view');
  // Show the mailbox and hide other views
  emailView.style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'none';
  // remove all messages
  removeMessages();
  
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  // fetch emails
  fetch(`${url}/emails/${mailbox}`)
  .then( response => response.json() )
  .then(result => {
    result.forEach(element => {
      const itemDiv = document.createElement('div');
      itemDiv.classList.add("flex")

      const emailDiv = document.createElement('div');
      emailDiv.innerHTML = `
      <div><b>${mailbox==='sent'?element.recipients:element.sender}</b></div>
      <div>${element.subject}</div>
      <div>${element.timestamp}</div>
      `;

      let archiveButton = undefined;
      if (mailbox==='inbox'){
        archiveButton = document.createElement('button');
        archiveButton.innerHTML = "Archive";
        archiveButton.onclick = () => {
          markReadArchive(element.id, 'archived', true, () => load_mailbox(mailbox));
        };
        archiveButton.classList.add('btn', 'btn-sm', 'btn-outline-primary');
      }
      else if (mailbox==='archive') {
        archiveButton = document.createElement('button');
        archiveButton.innerHTML = "Unarchive";
        archiveButton.onclick = () => {
          markReadArchive(element.id, 'archived', false, () => load_mailbox(mailbox));
        };
        archiveButton.classList.add('btn', 'btn-sm', 'btn-outline-primary');
      }


      emailDiv.classList.add("email-item");

      if (element.read) {
        emailDiv.style = 'background-color: lightgray';
      } else {
        emailDiv.style = 'background-color: white';
      }

      emailDiv.onclick = () => {
        markReadArchive(element.id, 'read', true);
        viewEmail(element.id);
      };

      itemDiv.append(emailDiv);
      if (archiveButton) {
        itemDiv.append(archiveButton);
      }
      emailView.append(itemDiv);
    });
  })
}

function removeMessages() {
  // remove all messages
  const messages = document.querySelector('#messages');
  
  if (messages.innerHTML){
    messages.innerHTML = '';
    
  };
}

function viewEmail(email_id) {

  // allocate email div
  const emailView = document.querySelector('#single-email-view');

  // activate and deactivate others
  emailView.style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';

  
  // request api
  fetch(`${url}/emails/${email_id}`)
  .then(response => response.json())
  .then( email => {
    document.querySelector('#email-sender').innerHTML = email.sender;
    document.querySelector('#email-recipients').innerHTML = email.recipients.join(', ');
    document.querySelector('#email-subject').innerHTML = email.subject;
    document.querySelector('#email-timestamp').innerHTML = email.timestamp;
    document.querySelector('#email-body').innerHTML = email.body;
    const buttonRead = document.querySelector('#button-read');
    buttonRead.onclick = () => {
      markReadArchive(email_id, 'read', false);
    };
    // to-do
    document.querySelector('#button-reply').onclick = () => {
      compose_email();
      document.querySelector('#compose-recipients').value = email.sender;
      const newSubject = email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`;
      document.querySelector('#compose-subject').value = newSubject;
      document.querySelector('#compose-body').value = `*****\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}\n*****\n`
    };
  })
  .catch( e => console.log(e));
}

function markReadArchive(email_id, feature, status, afterFn = undefined) {
  let payload = {
    method: "PUT"
  }

  if (feature == 'read') {
    payload.body = JSON.stringify({
      read: status
    })
  } else if (feature === 'archived') {
    payload.body = JSON.stringify({
      archived: status
    })
  } else {
    alert(`Page error, invalid option ${feature}`)
    return null;
  }

  fetch(`${url}/emails/${email_id}`, payload)
  // .then(response => response.json())
  .then(result => {
    console.log(result);
    if (afterFn) {
      afterFn();
    }
  })
  .catch( e => console.log(e))

}