import sbiCsv from "../../public/sbi.csv"
import fs from "fs"



 async function hello() {
    console.log("starting  ")
    const data = await fs.promises.readFile(sbiCsv, 'utf-8');
    console.log(data)

}


hello()