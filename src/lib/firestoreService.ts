

import { db } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch, query, orderBy, limit, where, getDoc, onSnapshot } from 'firebase/firestore';
import type { Employee, Visitor, Car, AccessLog, CarLog } from './types';

// --- Coleções ---
const EMPLOYEES_COLLECTION = 'employees';
const VISITORS_COLLECTION = 'visitors';
const CARS_COLLECTION = 'cars';
const ACCESS_LOGS_COLLECTION = 'accessLogs';
const CAR_LOGS_COLLECTION = 'carLogs';
const SEARCH_STATE_COLLECTION = 'searchState';

// --- Estado da Busca Sincronizada ---

export const setSearchTermInFirestore = async (username: string, term: string): Promise<void> => {
    const searchStateRef = doc(db, SEARCH_STATE_COLLECTION, username);
    await setDoc(searchStateRef, { term });
};

export const listenToSearchTermFromFirestore = (username: string, callback: (term: string) => void): () => void => {
    const searchStateRef = doc(db, SEARCH_STATE_COLLECTION, username);
    return onSnapshot(searchStateRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data().term || '');
        } else {
            callback('');
        }
    });
};

// --- Funcionários ---

export const listenToEmployeesFromFirestore = (callback: (employees: Employee[]) => void): () => void => {
    const q = query(collection(db, EMPLOYEES_COLLECTION), orderBy('name'));
    return onSnapshot(q, (querySnapshot) => {
        const employees = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
        callback(employees);
    });
};

export const addEmployeeToFirestore = async (employee: Employee): Promise<void> => {
    const employeeDocRef = doc(db, EMPLOYEES_COLLECTION, employee.id);
    await setDoc(employeeDocRef, employee);
};

export const updateEmployeeInFirestore = async (employee: Employee): Promise<void> => {
    const employeeDocRef = doc(db, EMPLOYEES_COLLECTION, employee.id);
    await setDoc(employeeDocRef, employee, { merge: true });
};

export const updateEmployeeIdInFirestore = async (oldId: string, newEmployeeData: Employee): Promise<void> => {
    const oldDocRef = doc(db, EMPLOYEES_COLLECTION, oldId);
    const oldDocSnap = await getDoc(oldDocRef);

    if (!oldDocSnap.exists()) {
        throw new Error("Funcionário original não encontrado.");
    }
    
    const batch = writeBatch(db);

    // Create the new employee document
    const newDocRef = doc(db, EMPLOYEES_COLLECTION, newEmployeeData.id);
    batch.set(newDocRef, newEmployeeData);

    // Find and update all access logs
    const logsQuery = query(collection(db, ACCESS_LOGS_COLLECTION), where("personId", "==", oldId));
    const logsSnapshot = await getDocs(logsQuery);
    logsSnapshot.forEach(logDoc => {
        const logRef = doc(db, ACCESS_LOGS_COLLECTION, logDoc.id);
        batch.update(logRef, { personId: newEmployeeData.id });
    });
    
    // Delete the old employee document
    batch.delete(oldDocRef);
    
    await batch.commit();
}


export const deleteEmployeeFromFirestore = async (employeeId: string): Promise<void> => {
    await deleteDoc(doc(db, EMPLOYEES_COLLECTION, employeeId));
};

// --- Visitantes ---

export const listenToVisitorsFromFirestore = (callback: (visitors: Visitor[]) => void): () => void => {
    const q = query(collection(db, VISITORS_COLLECTION), orderBy('name'));
    return onSnapshot(q, (querySnapshot) => {
        const visitors = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Visitor));
        callback(visitors);
    });
};

export const addOrUpdateVisitorInFirestore = async (visitor: Visitor): Promise<void> => {
    await setDoc(doc(db, VISITORS_COLLECTION, visitor.id), visitor, { merge: true });
};

export const deleteVisitorFromFirestore = async (visitorId: string): Promise<void> => {
    await deleteDoc(doc(db, VISITORS_COLLECTION, visitorId));
};

// --- Carros ---

export const listenToCarsFromFirestore = (callback: (cars: Car[]) => void): () => void => {
    const q = query(collection(db, CARS_COLLECTION), orderBy('fleet'));
    return onSnapshot(q, (querySnapshot) => {
        const cars = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Car));
        callback(cars);
    });
};

export const addOrUpdateCarInFirestore = async (car: Car): Promise<void> => {
    await setDoc(doc(db, CARS_COLLECTION, car.id), car, { merge: true });
};

export const deleteCarFromFirestore = async (carId: string): Promise<void> => {
    await deleteDoc(doc(db, CARS_COLLECTION, carId));
};

// --- Logs de Acesso (Pessoas) ---

export const listenToAccessLogsFromFirestore = (callback: (logs: AccessLog[]) => void, count: number = 50): () => void => {
    const q = query(collection(db, ACCESS_LOGS_COLLECTION), orderBy('entryTimestamp', 'desc'), limit(count));
    return onSnapshot(q, (querySnapshot) => {
        const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessLog));
        callback(logs);
    });
};

export const addOrUpdateAccessLogInFirestore = async (log: AccessLog): Promise<void> => {
    await setDoc(doc(db, ACCESS_LOGS_COLLECTION, log.id), log, { merge: true });
};

export const deleteAccessLogsInFirestore = async (logIds: string[]): Promise<void> => {
    if (logIds.length === 0) {
        return;
    }
    const batch = writeBatch(db);
    logIds.forEach(logId => {
        const docRef = doc(db, ACCESS_LOGS_COLLECTION, logId);
        batch.delete(docRef);
    });
    await batch.commit();
};


// --- Logs de Carros ---

export const listenToCarLogsFromFirestore = (callback: (logs: CarLog[]) => void, count: number = 50): () => void => {
    const q = query(collection(db, CAR_LOGS_COLLECTION), orderBy('startTime', 'desc'), limit(count));
    return onSnapshot(q, (querySnapshot) => {
        const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CarLog));
        callback(logs);
    });
};

export const addOrUpdateCarLogInFirestore = async (log: CarLog): Promise<void> => {
    await setDoc(doc(db, CAR_LOGS_COLLECTION, log.id), log, { merge: true });
};
