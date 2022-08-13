import React,{Component} from "react";
import { View, Text, StyleSheet, TouchableOpacity,
TextInput, Image, ImageBackground, KeyboardAvoidingView } from "react-native";
import * as Permissions from "expo-permissions";
import { BarCodeScanner } from "expo-barcode-scanner";
import db from '../config';
import firebase from "firebase";  


const bgImage = require("../assets/background2.png");
const appIcon = require("../assets/appIcon.png");
const appName =  require("../assets/appName.png");

export default class TransactionScreen extends Component {              
    constructor(props){
        super(props);
        this.state ={
          studentId: "",
          bookId: "",  
          domState: 'normal',
            hasCameraPermissions: null,
            scanned: false,
            scannedData: " ",
            bookName: "",
            studentName: "",
        }
    }
    getCameraPermissions = async domState=> {
        const {status} = await Permissions.askAsync(Permissions.CAMERA);

        this.setState({
            hasCameraPermissions: status==="granted",
            domState: domState,
            scanned: false
        })
    }
        hadlerBarCodeScanned = async ({type, data}) =>{
          const {domState} = this.state; 

          if (domState === "bookId") {
            this.setState({
               bookId: data,
              domState: "normal",
              scanned: true
              });
            }else if(domState === "studentId"){
              this.setState({
                studentId: data,
                domState: "normal",
                scanned: true
                })
            }
          }
          
          
          hadlerTransaction = () => {
            var {bookId,studentId} = this.state;

            this.getBookDetails(bookId);
            this.getStudentDetails(studentId);

           /* db.collection("book").doc(bookId).get().then( doc => {
              console.log(doc.data());

              var book = doc.data();
              console.log(book.book_Name);
                
              if (book.is_book_avalieble) {
                var{ bookName, studentName} = this.state;
                this.initiateBookIssue(bookId, studentId, bookName, studentName);
                alert("livro entregue ao aluno!");
              } else {
                var{ bookName, studentName} = this.state;
                this.initiateBookReturn(bookId, studentId, bookName, studentName);
                alert("livro retornado a biblioteca!  ");
              }
            })  */

            var transactiontype = this.checkBookAvailability(bookId);

            if (!transactiontype) {
              this.setState ({bookId:"",studentId:""});

              alert("o livro não existe na nossa biblioteca!")

            } else if(transactiontype === "issue"){
              var isElegible = this.checkStudentEligibilityForBookIssue(studentId); 

              if(isElegible){
              var{ bookName, studentName} = this.state;
                this.initiateBookIssue(bookId, studentId, bookName, studentName);
              }
                alert("livro entregue ao aluno!");

            } else {

              var isElegible = this.checkStudentEligibilityForBookReturn(bookId,studentId);

              if(isElegible){
              var{ bookName, studentName} = this.state;
              this.initiateBookReturn(bookId, studentId, bookName, studentName);
              }
              alert("livro retornado a biblioteca!  ");
            }
            
          };
          getBookDetails = bookId => {
            bookId = bookId.trim();
            db.collection("book").where("book_Id", "==", bookId).get().then(snapshot => {
                snapshot.docs.map(doc => {
                  this.setState({
                    bookName: doc.data().book_Name
                  });
                });
              });
          };
        
        
        //função para pegar as informações dos alunos do bando de dados
          getStudentDetails = studentId => {
            studentId = studentId.trim();
            db.collection("students").where("student_Id", "==", studentId).get().then(snapshot => {
                snapshot.docs.map(doc => {
                  this.setState({
                    studentName: doc.data().student_Name
                  });
                });
              });
          };
          
          
          //corpo da função para retirar ou devolver o livro. dependendo do tipo de transação, alterar o necessário
          
          initiateBookIssue = async (bookId, studentId, bookName, studentName) => {
            console.log("Livro entregue ao aluno!");
        
            //adicionar uma transação
            db.collection("transactions").add({
              student_Id: studentId,
              student_Name: studentName,
              book_Id: bookId,
              book_Name: bookName,
              date: firebase.firestore.Timestamp.now().toDate(),
              transaction_type: "issue"
            });
            // alterar status do livro
            db.collection("book")
              .doc(bookId)
              .update({
                is_book_avalieble: false
              });
            // alterar o número de livros retirados pelo aluno
            db.collection("students")
              .doc(studentId)
              .update({
                number_of_books_issued: firebase.firestore.FieldValue.increment(1)
                //o valor entre parenteses será 1 em caso de retirada, e -1 em caso de devolução
              });
        
            // atualizando estado local
            this.setState({
              bookId: "",
              studentId: ""
            });
        
          }

          initiateBookReturn= async (bookId, studentId, bookName, studentName) => {
            console.log("Livro Devolvido pelo aluno!");
        
            //adicionar uma transação
            db.collection("transactions").add({
              student_Id: studentId,
              student_Name: studentName,
              book_Id: bookId,
              book_Name: bookName,
              date: firebase.firestore.Timestamp.now().toDate(),
              transaction_type: "return"
              //se for retirado, será "issue", se for devolução será "return"
            });
            // alterar status do livro
            db.collection("book")
              .doc(bookId)
              .update({
                is_book_avalieble: true
                //se o aluno estiver retirando o livro, será falso, se estiver devolvendo, será true
              });
            // alterar o número de livros retirados pelo aluno
            db.collection("students")
              .doc(studentId)
              .update({
                number_of_books_issued: firebase.firestore.FieldValue.increment(-1)
                //o valor entre parenteses será 1 em caso de retirada, e -1 em caso de devolução
              });
        
            // atualizando estado local
            this.setState({
              bookId: "",
              studentId: ""
            });
        
          }

          checkBookAvailability = async bookId => {
            const bookRef = await db.collection("book").where("book_Id","==",bookId).get();

            var transactionType = "";

            if (bookRef.docs.length == 0 ) {
              transactionType = false;
            } else {
              bookRef.docs.map( doc => {
                transactionType = doc.data().is_book_avalieble ? "issue" : "return";
              })
            }

            return transactionType;
          }
          //chacar a elegibilidade do aluno para pegar livro
          checkStudentEligibilityForBookIssue = async studentId => {
            const studentRef = await db.collection("students").where("student_Id","==",studentId).get();

            var isStudentElegible = "";

            if (studentRef.docs.length==0) {
              this.setState({
                bookId: "",
                studentId: "",
              });
              isStudentElegible = false
              alert("O Id do aluno não existe no banco de dados!");
            } else {
              studentRef.docs.map ( doc => {
                if (doc.data().number_of_books_issued < 3) {
                  isStudentElegible = true;
                } else {
                  isStudentElegible = false;
                  alert("o aluno Subtraiu os 3 livros");
                  this.setState({
                    bookId: "",
                    studentId: "",
                  });
                }
              })
            }
          }
          //checa a elegibilidade do aluno para devolver um livro
          checkStudentEligibilityForBookReturn =async (bookId, studentId) => {
            const transactionRef =  await db.collection("transactions").where("book_Id","==", bookId).limit(1).get();

            var isStudentElegible = ""

            transactionRef.docs.map( doc => {
              var lastBookTransaction = doc.data();

              if (lastBookTransaction.student_Id === studentId) {
                isStudentElegible = true;
              } else {
                isStudentElegible = false;
                alert("o livro não foi subitraido por esse aluno!")
                this.setState({
                  bookId: "",
                  studentId: "",
              })
              }
            })
            return isStudentElegible;

          }

        render()  {
            const{ domState, hasCameraPermissions, scanned, scannedData, bookId, studentId} = this.state;
            if (domState !== "normal"){
                return(
                    <BarCodeScanner
                    onBarCodeScanned={scanned ? undefined : this.hadlerBarCodeScanned}
                    style= {StyleSheet.absoluteFillObject}/>    
                )
            }
            return (
                <KeyboardAvoidingView behavior="padding" style={styles.container}>
                <ImageBackground source={bgImage} style={styles.bgImage}>
                <View style={styles.upperContainer} >
                  <Image source={appIcon} style={styles.appIcon} />
                  <Image source={appName} style={[styles.appName, { marginTop: 25 }]} />
                </View>
          
                <View style={styles.lowerContainer}>
                  <View style={styles.textinputContainer} >
                    <TextInput style={styles.textinput} 
                    placeholder={"ID do Livro"}
                    placeholderTextColor={"white"}
                   value={bookId}
                   onChangeText={text => this.setState(  {bookId: text})}
                    />
          
                    <TouchableOpacity 
                    style={styles.scanbutton}
                    onPress={()=> this.getCameraPermissions("bookId")}
                    >
                      <Text style={styles.scanbuttonText}  > Digitalizar</Text>
                    </TouchableOpacity>
          
                  </View>
          
                  <View style={[styles.textinputContainer, { marginTop: 25 }]}>
                    <TextInput
                    style={styles.textinput} 
                    placeholder={"ID do Aluno"}
                    placeholderTextColor={"white"}
                    value={studentId}
                    onChangeText={text => this.setState(  {studentId: text})}
                    />
          
                    <TouchableOpacity 
                    style={styles.scanbutton} 
                    onPress={()=> this.getCameraPermissions("studentId")}
                    >
                      <Text style={styles.scanbuttonText} >Digitalizar</Text>
                    </TouchableOpacity>
          
                  </View>
                <TouchableOpacity style={styles.button}
                onPress = {this.hadlerTransaction}>
                  <Text style={styles.buttonText}>Enviar</Text>
                </TouchableOpacity>

                </View>
                </ImageBackground> 
                </KeyboardAvoidingView>
          
          
        )
    }
}
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "black"
    },
    upperContainer: {
      flex: 0.5,
      justifyContent: "center",
      alignItems: "center"
    },
    lowerContainer: {
      flex: 0.5,
      alignItems: "center"
    },
    text: {
      color: "#ffff",
      fontSize: 30
    },
    textinput: {
      width: "57%",
      height: 50,
      padding: 10,
      borderColor: "white",
      borderRadius: 10,
      borderWidth: 3,
      fontSize: 18,
      backgroundColor: "#5653D4",
      fontFamily: "Rajdhani_600SemiBold",
      color: "#FFFFFF"
    },
    scanbutton: {
      width: 100,
      height: 50,
      backgroundColor: "#9DFD24",
      borderTopRightRadius: 10,
      borderBottomRightRadius: 10,
      justifyContent: "center",
      alignItems: "center"
    },
    scanbuttonText: {
      fontSize: 20,
      color: "#0A0101",
      fontFamily: "Rajdhani_600SemiBold"
    },
    textinputContainer: {
      borderWidth: 2,
      borderRadius: 10,
      flexDirection: "row",
      backgroundColor: "#9DFD24",
      borderColor: "#FFFFFF"
    },
    appIcon: {
      width: 200,
      height: 200,
      resizeMode: "contain",
      marginTop: 80,
  
    },
    appName: {
      width: 500,
      resizeMode: "contain",
      borderWidth: 3,
      borderColor: "white"
  
    },
    bgImage: {
      flex: 1,
      resizeMode: "cover",
      justifyContent: "center"
    },
    button: {
      width: "43%",
      height: 55,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F48D20",
      borderRadius: 15
    },
    buttonText: {
      fontSize: 24,
      color: "#FFFFFF",
      fontFamily: "Rajdhani_600SemiBold"
    }
  });


