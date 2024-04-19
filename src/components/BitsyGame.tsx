import { useEffect } from "react";

export const BitsyGame = ({
    game,
    setPlaying,
}: {
    game: string;
    setPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    useEffect(() => {
        setPlaying(true);
    });
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <iframe width="800px" height="800px" srcDoc={game}></iframe>
        </div>
    );
};
