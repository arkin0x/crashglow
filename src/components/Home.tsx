import { useEffect, useContext, useState } from "react";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import { NDKContext } from "../providers/NDKProvider";
import { Publish } from "./Publish";
import { useNavigate } from "react-router-dom";

export const Home = () => {
    const navigate = useNavigate();
    const [showGames, setShowGames] = useState<boolean>(true);
    const ndk = useContext(NDKContext);
    const [games, setGames] = useState<NDKEvent[]>([]);

    useEffect(() => {
        if (!ndk) return;
        const fetchLatestGames = async () => {
            const loaded = await ndk.fetchEvents({ kinds: [1], limit: 10, "#t": ["crashglow"] });
            console.log(loaded);
            const filtered = Array.from(loaded).filter((event) => {
                if (event.tags.find((tag) => tag[0] === "u")) return true;
                return false;
            });
            setGames(filtered);
        };
        fetchLatestGames();
    }, [ndk]);

    const LatestGames = () => {
        const latest = games.filter((game) => !isTest(game)).map((game) => {
            const u = game.tags.find((tag) => tag[0] === "u");
            // const version = u![1].split('_')[1] || u![1].split(':')[1] || u![2] || '0.1.0?'
            let version = "0.1.0?";
            try {
                if (u) version = u[2];
            } catch (e) {
                console.log(e);
                // no action
            }
            if (!game.content) return null;
            if (game.content === "test") return null;
            const title = game.tags.find((tag) => tag[0] === "subject");

            return (
                <div key={game.id} className="game-card">
                    <h3 className="game-card-title">
                        {title && title[1] ? title[1] : null}
                        <small style={{ float: "right" }}>{version}</small>
                    </h3>
                    <img className="game-card-preview" src={game.content.split("\n")[0]} />
                    <br />
                    <br />
                    <button
                        className="button"
                        onClick={() => {
                            navigate(`/game/${game.id}`);
                        }}
                    >
                        Play 👾
                    </button>
                </div>
            );
        });
        if (latest.length === 0) return <p>No games found! 😿</p>;
        return latest;
    };

    return (
        <div id="component-home" className="primary">
            <div className="layout">
                <Publish setShowGames={setShowGames} />
                {showGames ? (
                    <>
                        <h2>Games</h2>
                        <LatestGames />
                    </>
                ) : null}
            </div>
        </div>
    );
};

function isTest(game: NDKEvent) {
    try {
        const findTest = game.tags.find((tag: string[]) => tag[0] === "subject");
        if (findTest && findTest[1]) {
            return !!findTest[1].toLowerCase().includes("test") || game.content.includes("test");
        }
    } catch (e) {
        // invalid tag. Not sure. Show it.
    }
    return false;
}
