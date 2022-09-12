import type { NextPage } from "next";
import Head from "next/head";
import { useEffect } from "react";
import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
    useEffect(() => {
        (async () => await fetch("/api/connect"))();
    }, []);
    
    return (
        <div className={styles.container}>
            <Head>
                <title>PercyBot</title>
                <meta name="description" content="Welcome to PercyBot" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>
                <h1>
					Welcome to PercyBot
                </h1>
            </main>

            <footer className={styles.footer}>
                Powered by me
            </footer>
        </div>
    );
};

export default Home;
