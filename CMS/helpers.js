import { ref } from "@firebase/storage";
import { query, getFirestore, onSnapshot, doc, collection, getDoc, getDocs, where, orderBy, setDoc } from "firebase/firestore";
import { TWITTER_HANDLE, APP_ICON, API_URL } from '../constants';
import Head from 'next/head';

export const getMetaData = (metaTitle, metaDescription, siteUrl, thumbnailUrl) => {
    return <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="icon" href={APP_ICON} />

        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:image" content={thumbnailUrl || '/thumbnail_1600.png'} />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content={TWITTER_HANDLE} />
        <meta name="twitter:creator" content={TWITTER_HANDLE} />
    </Head>;
}

export const loadWebpageDataSnapshot = async (projectName, cb) => {
    const db = getFirestore();
    
    const q = doc(db, 'CMS_WebsiteContent', projectName);
    var unsubscribe = onSnapshot(q, (docSnapshot) => {
        
        cb(docSnapshot.data() || {});
    });
}

export const loadDynamicDataSnapshot = async (projectName, collectionName, cb) => {
    const db = getFirestore();
    // console.log('loadDynamicDataSnapshot: ', db)
    
    const q = query(collection(db, "CMS", projectName, collectionName));
    var unsubscribe = onSnapshot(q, (querySnapshot) => {
        const out = [];
        querySnapshot.forEach((doc) => {
            out.push({
                id: doc.id,
                ...doc.data()
            });
        });
        cb(out);
    })
}

export const loadWebpageData = async (projectName) => {
    const db = getFirestore();
    const docRef = doc(db, 'CMS_WebsiteContent', projectName);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return {};
    
}

export const loadDynamicData = async (projectName, collectionName) => {
    const db = getFirestore();
    
    const q = query(
        collection(db, 'CMS', projectName, collectionName),
        orderBy('orderInList'), // Hard defined field in CMS.js
     );
    const querySnapshot = await getDocs(q);
    const out = [];
    querySnapshot.forEach(d => {
        // console.log('id: ', d.id, 'data: ', Object.keys(d.data()).length);
        out.push({
            id: d.id,
            path: d.ref.path,
            ...d.data()
        });
    });
    
    // Save each with new data, for now.
    // const docRef = doc(db, 'CMS', projectName, collectionName, d.id);
    // var _d = d.data();
    // _d.orderInList = _d.orderInList || null; 
    // console.log('saving: d: ', _d);

    // setDoc(docRef, _d, { merge: true})
    //     .then(()=>{
    //         console.log('Successfully saved entry');

    //     })
    //     .catch(err => {
    //         console.error("Error saving new entry: ", err);
    //     })

    return out;
    
}

export const loadSpreadsheetData = async () => {
    // try {
        return await fetch(API_URL + '/api/loadSpreadsheet').then(res => {
            if (res.status === 404 || res.status === 500) {
                return [];
            }
            return res.json();
        });
    // } catch(err) {
    //     console.log("Caught error loading spreadsheet future meetings: ", err)
    //     return [];
    // }
}

// Via spreadsheet that saves into CMS document via Appscript + Firebase service account.
export const loadSpreadsheetDataFIRESTORE = async (docName) => {
    const db = getFirestore();
    const docRef = doc(db, 'CMS', PROJECT_NAME, 'SPREADSHEET_DATA', docName);
    const docSnapshot = await getDoc(docRef);
    return docSnapshot.data().data;
}

export const createDateFromDDMMYYYY = (d) => {
    if (!d) return '';
    var dd = d.toString().split('/');
    if (dd[2].length <= 2) dd[2] = '20' + dd[2];
    return new Date(`${dd[2]} ${dd[1]} ${dd[0]}`);
}

// Load from doc.ref.path string "CMS/xyz/abc" 
export const loadFromPath = async (path) => {
    if (!path || !path.length || path === 'undefined') return {}; // Instead of undefined.
    // Backward compatibility with forced arrays.
    if (Array.isArray(path) ) {
        path = path[0];
    }
    // console.log("Loading from path: ", path);
    const db = getFirestore();
    const docRef = doc(db, path);
    const docSnapshot = await getDoc(docRef);
    return {
        id: docSnapshot.id,
        ...docSnapshot.data()
    }
}

`
Big Brothers Big Sisters =>
big-brothers-big-sisters
`
export const collectionNameToUrl = (collectionName) => {
    // console.log("converting: ", collectionName);
    collectionName = stripHTML(collectionName)
                        .trim()
                        .toLowerCase()
                        .replace(/'/g, '')
                        .replace(/"/g, '')
                        .replace(/\?/g, '')
                        .replace(/\+/g, '')
                        .replace(/\//g, '')
                        .replace(/[ ]{2,}/g, ' ') // Multiple spaces with one
                        .replace(/[ ]/g, '-')
                        .replace(/[_]/g, '-')
                        .replace(/[-]{2,}/g, '-'); // Multiple hyphens with one.
    return collectionName;
}

export function stripHTML(html) {
    // https://github.com/vercel/next.js/blob/canary/examples/active-class-name/components/ActiveLink.tsx
    // new URL(asPath, location.href).pathname // Remove query and hash.

    html = (html || "")
        .replace(/(<([^>]+)>)/gi, "")
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&');
    return html;
    // var tmp = document.createElement("DIV");
    // tmp.innerHTML = html;
    // return tmp.textContent || tmp.innerText;
}

export const getCurrentField = (currentFields, field) => {
    for(var c of currentFields){
        if(c.type === field.type){
            
            return c;
        }
    }
    return {};
}

// Same as above, but specific field name.
export const getFieldName = (currentFields, fieldName, forceArray) => {
    if (!currentFields) return '';
    for (var c of currentFields) {
        // console.log('c: ', c[fieldName]);
        if (c[fieldName]) {
            if (c[fieldName].includes('[') && c[fieldName].includes(']')) {
                // console.log("c.fieldName: ", fieldName, c[fieldName])
                // Process it as an array and return.
                return JSON.parse(c[fieldName]) || [];
            } 
            // Return direct value.
            
            if (forceArray) {
                return [ c[fieldName] ];
            }

            return c[fieldName];
        }
    }
    return '';
}

export const getDocIdFromPath = (path) => {
    if (!path.includes('/')) return '';
    return path.split('/').slice(-1)[0];
}

// ellipsis if text is longer than N
export const truncate = (str, maxLen) => {
    if (!str) return "";
    if (str.length > maxLen)
        return str.substring(0, maxLen) + '...';
    
    return str;
}

// export const toHyphenURL = (str) => {
//     return str.toLowerCase()
//         .replace(/[ ]/g, '-');
// }


export const swapIndexes = (arr, oldIndex, newIndex) => {
    
    const _arr = arr.slice();

    var oldVal = _arr[oldIndex];
    var newVal = _arr[newIndex];

    _arr[oldIndex] = newVal;
    _arr[newIndex] = oldVal;
    
    return _arr;

}

function getMonthName(monthNumber) {
    const date = new Date();
    date.setMonth(monthNumber - 1);
  
    return date.toLocaleString('en-US', { month: 'long' });
}


export const getDayOfWeek = (dayNumber) => {
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
    return days[dayNumber];
}

export const fromFirestoreDate = (obj) => {
    // console.log("obj", obj)
    if (!obj.seconds) {
        return obj;
    }
    var d = new Date(obj.seconds * 1000);
    return `${d.getDate()} ${getMonthName(d.getMonth())} ${d.getFullYear()}` 
}


