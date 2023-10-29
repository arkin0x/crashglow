import { useParams } from "react-router-dom"
import { Retrieve } from "./Retrieve"

export const Game: React.FC<{setPlaying: React.Dispatch<React.SetStateAction<boolean>>}> = ({setPlaying}) => {
  const { id }: { id?: string } = useParams<{ id?: string }>()
  return <Retrieve urlIdentifier={id} setPlaying={setPlaying} />
}