import { useParams } from "react-router-dom"
import { Retrieve } from "./Retrieve"

export const Game: React.FC<{setPlaying: React.Dispatch<React.SetStateAction<boolean>>}> = ({setPlaying}) => {
  const { uuid }: { uuid?: string } = useParams<{ uuid?: string }>()
  return <Retrieve uuid={uuid} setPlaying={setPlaying} />
}