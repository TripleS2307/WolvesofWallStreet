import { FaDollarSign } from "react-icons/fa";

function makeRating( sentiment){
    if( sentiment > 0.2){
        return 5;
    } else if (sentiment > 0.05){
        return 4;
    } else if (sentiment > 0){
        return 3;
    } else if (sentiment > -0.05){
        return 2;
    }else{
        return 1;
    }
}

function Star(props) {
    return (
        <div>
        {[...Array(makeRating(props.rating))].map(star => {
            return <FaDollarSign size={25} color={(makeRating(props.rating) > 2) ? "green" : "red"}/>
          })}
        {[...Array(5-makeRating(props.rating))].map(star => {
            return <FaDollarSign size={25} color="white" style={{opacity:0.5}}/>
          })}
        </div>
    );

}


export default Star;