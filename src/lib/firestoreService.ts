
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { Employee } from './types';

const EMPLOYEES_COLLECTION = 'employees';

export const getEmployeesFromFirestore = async (): Promise<Employee[]> => {
    const querySnapshot = await getDocs(collection(db, EMPLOYEES_COLLECTION));
    const employees: Employee[] = [];
    querySnapshot.forEach((doc) => {
        employees.push({ id: doc.id, ...doc.data() } as Employee);
    });
    return employees;
};

export const addEmployeeToFirestore = async (employee: Employee): Promise<void> => {
    await setDoc(doc(db, EMPLOYEES_COLLECTION, employee.id), employee);
};

export const updateEmployeeInFirestore = async (employee: Employee): Promise<void> => {
    await setDoc(doc(db, EMPLOYEES_COLLECTION, employee.id), employee, { merge: true });
};

export const deleteEmployeeFromFirestore = async (employeeId: string): Promise<void> => {
    await deleteDoc(doc(db, EMPLOYEES_COLLECTION, employeeId));
};

export const migrateLocalStorageToFirestore = async (employees: Employee[]): Promise<void> => {
    const batch = writeBatch(db);
    employees.forEach((employee) => {
        const docRef = doc(db, EMPLOYEES_COLLECTION, employee.id);
        batch.set(docRef, employee);
    });
    await batch.commit();
};
